// Tiny, dependency-free math expression parser + evaluator.
// Supports: + - * / ^ % , parentheses, unary minus, implicit constants,
// and a broad set of math functions. Compiles to a reusable JS closure.

export type Scope = Record<string, number>;

type Token =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "comma" };

const FUNCS: Record<string, (...a: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  atan2: Math.atan2,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  exp: Math.exp,
  ln: Math.log,
  log: (x: number, b?: number) => (b === undefined ? Math.log10(x) : Math.log(x) / Math.log(b)),
  log10: Math.log10,
  log2: Math.log2,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  mod: (a: number, b: number) => a % b,
  hypot: Math.hypot,
  step: (x: number) => (x >= 0 ? 1 : 0),
  clamp: (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x)),
};

export const FUNCTION_NAMES = Object.keys(FUNCS);

const CONSTS: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j]!)) j++;
      // scientific notation
      if (src[j] === "e" || src[j] === "E") {
        const k = j + 1;
        const s = src[k] === "+" || src[k] === "-" ? k + 1 : k;
        if (/[0-9]/.test(src[s] ?? "")) {
          let m = s;
          while (m < src.length && /[0-9]/.test(src[m]!)) m++;
          j = m;
        }
      }
      const v = Number(src.slice(i, j));
      if (Number.isNaN(v)) throw new Error(`Bad number near "${src.slice(i, j)}"`);
      out.push({ t: "num", v });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z_0-9]/.test(src[j]!)) j++;
      out.push({ t: "id", v: src.slice(i, j) });
      i = j;
      continue;
    }
    if (c === "(") {
      out.push({ t: "lp" });
      i++;
      continue;
    }
    if (c === ")") {
      out.push({ t: "rp" });
      i++;
      continue;
    }
    if (c === ",") {
      out.push({ t: "comma" });
      i++;
      continue;
    }
    if ("+-*/^%".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    throw new Error(`Unexpected character "${c}"`);
  }
  return out;
}

// Insert implicit multiplication: 2x, 3(x+1), (x)(y), 2sin(x)
function insertImplicit(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const cur = tokens[i]!;
    out.push(cur);
    const next = tokens[i + 1];
    if (!next) break;
    const curEnds = cur.t === "num" || cur.t === "id" || cur.t === "rp";
    const nextStarts = next.t === "num" || next.t === "id" || next.t === "lp";
    if (curEnds && nextStarts) {
      // a function name followed by "(" is a call, not multiplication
      if (cur.t === "id" && next.t === "lp" && FUNCS[cur.v]) continue;
      out.push({ t: "op", v: "*" });
    }
  }
  return out;
}

type Node =
  | { k: "num"; v: number }
  | { k: "var"; v: string }
  | { k: "bin"; op: string; a: Node; b: Node }
  | { k: "neg"; a: Node }
  | { k: "call"; name: string; args: Node[] };

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 4 };

function parse(tokens: Token[]): { node: Node; vars: Set<string> } {
  let pos = 0;
  const vars = new Set<string>();
  const peek = () => tokens[pos];

  function parseExpr(minPrec = 0): Node {
    let left = parseUnary();
    for (;;) {
      const tk = peek();
      if (!tk || tk.t !== "op") break;
      const prec = PREC[tk.v]!;
      if (prec < minPrec) break;
      pos++;
      const rightAssoc = tk.v === "^";
      const right = parseExpr(rightAssoc ? prec : prec + 1);
      left = { k: "bin", op: tk.v, a: left, b: right };
    }
    return left;
  }

  function parseUnary(): Node {
    const tk = peek();
    if (tk && tk.t === "op" && (tk.v === "-" || tk.v === "+")) {
      pos++;
      const a = parseUnary();
      return tk.v === "-" ? { k: "neg", a } : a;
    }
    return parsePrimary();
  }

  function parsePrimary(): Node {
    const tk = peek();
    if (!tk) throw new Error("Unexpected end of expression");
    if (tk.t === "num") {
      pos++;
      return { k: "num", v: tk.v };
    }
    if (tk.t === "lp") {
      pos++;
      const n = parseExpr(0);
      if (peek()?.t !== "rp") throw new Error("Missing closing parenthesis");
      pos++;
      return n;
    }
    if (tk.t === "id") {
      pos++;
      if (FUNCS[tk.v] && peek()?.t === "lp") {
        pos++;
        const args: Node[] = [];
        if (peek()?.t !== "rp") {
          for (;;) {
            args.push(parseExpr(0));
            if (peek()?.t === "comma") {
              pos++;
              continue;
            }
            break;
          }
        }
        if (peek()?.t !== "rp") throw new Error(`Missing ")" after ${tk.v}(`);
        pos++;
        return { k: "call", name: tk.v, args };
      }
      if (tk.v in CONSTS) return { k: "num", v: CONSTS[tk.v]! };
      vars.add(tk.v);
      return { k: "var", v: tk.v };
    }
    throw new Error("Unexpected token in expression");
  }

  const node = parseExpr(0);
  if (pos < tokens.length) throw new Error("Unexpected trailing input");
  return { node, vars };
}

function evalNode(n: Node, scope: Scope): number {
  switch (n.k) {
    case "num":
      return n.v;
    case "var": {
      const v = scope[n.v];
      return v === undefined ? NaN : v;
    }
    case "neg":
      return -evalNode(n.a, scope);
    case "bin": {
      const a = evalNode(n.a, scope);
      const b = evalNode(n.b, scope);
      switch (n.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "%":
          return a % b;
        case "^":
          return Math.pow(a, b);
      }
      return NaN;
    }
    case "call":
      return FUNCS[n.name]!(...n.args.map((a) => evalNode(a, scope)));
  }
}

export interface Compiled {
  ok: true;
  vars: string[];
  eval: (scope: Scope) => number;
}
export interface CompileError {
  ok: false;
  error: string;
}

export function compile(src: string): Compiled | CompileError {
  try {
    const cleaned = src.replace(/·/g, "*").replace(/−/g, "-").trim();
    if (!cleaned) return { ok: false, error: "Enter an expression" };
    const { node, vars } = parse(insertImplicit(tokenize(cleaned)));
    return {
      ok: true,
      vars: [...vars],
      eval: (scope: Scope) => evalNode(node, scope),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid expression" };
  }
}
