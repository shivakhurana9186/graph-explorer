// The graph module library. Everything here is DATA — adding a new
// quantity pair means adding an entry, never touching UI code.

export interface VarDef {
  key: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Short plain-language note shown under the slider */
  note?: string;
}

export interface UnitToggle {
  axis: "x" | "y";
  label: string;
  options: { name: string; factor: number }[];
}

export interface GraphModule {
  id: string;
  name: string;
  topic: string;
  /** y = f(x, ...vars) — parsed by the expression engine */
  expr: string;
  /** for parametric/polar modes */
  xExpr?: string;
  plot?: "line" | "polar" | "parametric";
  xLabel: string;
  xUnit?: string;
  yLabel: string;
  yUnit?: string;
  formula: string;
  blurb: string;
  /** step-by-step story of where the equation comes from */
  derivation?: string[];

  variables: VarDef[];
  xMin?: string; // expression (may use variables)
  xMax?: string;
  /** meaning of visual features, plain language, may use {var} placeholders */
  meaning?: {
    slope?: string;
    area?: string;
    curvature?: string;
    intercept?: string;
    period?: string;
  };
  units?: UnitToggle[];
  keywords?: string[];
}

export const TOPICS = [
  "Kinematics",
  "Dynamics",
  "Waves & Oscillation",
  "Electricity",
  "Thermodynamics & Gases",
  "Fluids",
  "Optics",
  "Chemistry",
  "Math functions",
] as const;

export const MODULES: GraphModule[] = [
  // ---------------- Kinematics ----------------
  {
    id: "v-t",
    name: "Velocity vs Time",
    topic: "Kinematics",
    expr: "u + a*x",
    xLabel: "Time",
    xUnit: "s",
    yLabel: "Velocity",
    yUnit: "m/s",
    formula: "v = u + a·t",
    blurb: "How fast something is moving as time passes, under constant acceleration.",
    variables: [
      { key: "u", label: "Initial velocity", unit: "m/s", min: -20, max: 20, step: 0.1, default: 2 },
      {
        key: "a",
        label: "Acceleration",
        unit: "m/s²",
        min: -10,
        max: 10,
        step: 0.1,
        default: 2,
        note: "This is the slope of the line.",
      },
    ],
    xMax: "10",
    meaning: {
      slope: "The slope of a velocity–time graph is the acceleration.",
      area: "The area under the line is the displacement (how far it travelled).",
      intercept: "Where the line meets the y-axis is the starting velocity.",
    },
    units: [
      {
        axis: "y",
        label: "Speed units",
        options: [
          { name: "m/s", factor: 1 },
          { name: "km/h", factor: 3.6 },
        ],
      },
    ],
    keywords: ["speed", "acceleration", "motion"],
  },
  {
    id: "s-t",
    name: "Distance vs Time",
    topic: "Kinematics",
    expr: "s0 + u*x + 0.5*a*x^2",
    xLabel: "Time",
    xUnit: "s",
    yLabel: "Distance",
    yUnit: "m",
    formula: "s = s₀ + u·t + ½a·t²",
    blurb: "Position over time. A straight line means steady speed; a curve means acceleration.",
    variables: [
      { key: "s0", label: "Start position", unit: "m", min: -50, max: 50, step: 1, default: 0 },
      { key: "u", label: "Initial velocity", unit: "m/s", min: -20, max: 20, step: 0.5, default: 5 },
      { key: "a", label: "Acceleration", unit: "m/s²", min: -10, max: 10, step: 0.1, default: 1 },
    ],
    xMax: "10",
    meaning: {
      slope: "The slope of a distance–time graph is the velocity at that moment.",
      curvature: "Curving upward means speeding up; curving downward means slowing down.",
    },
    keywords: ["position", "displacement"],
  },
  {
    id: "a-t",
    name: "Acceleration vs Time",
    topic: "Kinematics",
    expr: "a0 + j*x",
    xLabel: "Time",
    xUnit: "s",
    yLabel: "Acceleration",
    yUnit: "m/s²",
    formula: "a = a₀ + j·t",
    blurb: "Acceleration that itself changes at a steady rate (jerk).",
    variables: [
      { key: "a0", label: "Initial acceleration", unit: "m/s²", min: -10, max: 10, step: 0.1, default: 3 },
      { key: "j", label: "Jerk", unit: "m/s³", min: -5, max: 5, step: 0.1, default: 0 },
    ],
    xMax: "10",
    meaning: { area: "The area under an acceleration–time graph is the change in velocity." },
  },
  {
    id: "projectile",
    name: "Projectile height vs Distance",
    topic: "Kinematics",
    expr: "x*tan(theta*pi/180) - (g*x^2)/(2*v0^2*cos(theta*pi/180)^2)",
    xLabel: "Horizontal distance",
    xUnit: "m",
    yLabel: "Height",
    yUnit: "m",
    formula: "y = x·tanθ − g·x² / (2v₀²cos²θ)",
    blurb: "The parabola traced by a thrown object.",
    variables: [
      { key: "v0", label: "Launch speed", unit: "m/s", min: 1, max: 60, step: 1, default: 20 },
      { key: "theta", label: "Launch angle", unit: "°", min: 1, max: 89, step: 1, default: 45 },
      { key: "g", label: "Gravity", unit: "m/s²", min: 1, max: 25, step: 0.1, default: 9.81 },
    ],
    xMax: "120",
    meaning: {
      curvature: "Gravity bends the path into a downward parabola.",
      slope: "The slope is the launch direction at the start, flattening to zero at the peak.",
    },
  },

  // ---------------- Dynamics ----------------
  {
    id: "hooke",
    name: "Force vs Extension (Hooke's law)",
    topic: "Dynamics",
    expr: "k*x",
    xLabel: "Extension",
    xUnit: "m",
    yLabel: "Force",
    yUnit: "N",
    formula: "F = k·x",
    blurb: "Stretching a spring: force grows in proportion to how far you stretch it.",
    variables: [{ key: "k", label: "Spring constant", unit: "N/m", min: 1, max: 200, step: 1, default: 50 }],
    xMax: "0.5",
    meaning: {
      slope: "The slope is the spring constant — a stiffer spring gives a steeper line.",
      area: "The area under the line is the elastic energy stored in the spring.",
    },
  },
  {
    id: "f-a",
    name: "Force vs Acceleration (Newton's 2nd law)",
    topic: "Dynamics",
    expr: "m*x",
    xLabel: "Acceleration",
    xUnit: "m/s²",
    yLabel: "Force",
    yUnit: "N",
    formula: "F = m·a",
    blurb: "How much push you need to accelerate a mass.",
    variables: [{ key: "m", label: "Mass", unit: "kg", min: 0.1, max: 50, step: 0.1, default: 5 }],
    xMax: "10",
    meaning: { slope: "The slope of a force–acceleration graph is the mass of the object." },
  },
  {
    id: "ke-v",
    name: "Kinetic energy vs Speed",
    topic: "Dynamics",
    expr: "0.5*m*x^2",
    xLabel: "Speed",
    xUnit: "m/s",
    yLabel: "Kinetic energy",
    yUnit: "J",
    formula: "E = ½m·v²",
    blurb: "Doubling the speed quadruples the energy.",
    variables: [{ key: "m", label: "Mass", unit: "kg", min: 0.1, max: 100, step: 0.1, default: 2 }],
    xMax: "20",
    meaning: { curvature: "The upward curve shows energy rising with the square of speed." },
  },
  {
    id: "gravitation",
    name: "Gravitational force vs Distance",
    topic: "Dynamics",
    expr: "6.674e-11*M*m/(x^2)",
    xLabel: "Separation",
    xUnit: "m",
    yLabel: "Force",
    yUnit: "N",
    formula: "F = G·M·m / r²",
    blurb: "An inverse-square law: force falls off fast as objects move apart.",
    variables: [
      { key: "M", label: "Mass 1", unit: "×10⁹ kg", min: 1, max: 100, step: 1, default: 50 },
      { key: "m", label: "Mass 2", unit: "×10⁹ kg", min: 1, max: 100, step: 1, default: 50 },
    ],
    xMin: "0.5",
    xMax: "20",
    meaning: { curvature: "The steep drop is the inverse-square law: double the distance, quarter the force." },
  },

  // ---------------- Waves & Oscillation ----------------
  {
    id: "shm",
    name: "SHM position vs Time",
    topic: "Waves & Oscillation",
    expr: "A*sin(2*pi*f*x + phi)",
    xLabel: "Time",
    xUnit: "s",
    yLabel: "Displacement",
    yUnit: "m",
    formula: "x(t) = A·sin(2πf·t + φ)",
    blurb: "A pendulum or mass on a spring swinging back and forth.",
    variables: [
      { key: "A", label: "Amplitude", unit: "m", min: 0.1, max: 5, step: 0.1, default: 2 },
      { key: "f", label: "Frequency", unit: "Hz", min: 0.1, max: 5, step: 0.05, default: 0.5 },
      { key: "phi", label: "Phase shift", unit: "rad", min: -3.14, max: 3.14, step: 0.05, default: 0 },
    ],
    xMax: "10",
    meaning: {
      period: "One full back-and-forth takes T = 1/f seconds.",
      slope: "The slope at any moment is the velocity — biggest at the middle, zero at the ends.",
    },
  },
  {
    id: "damped",
    name: "Damped oscillation vs Time",
    topic: "Waves & Oscillation",
    expr: "A*exp(-b*x)*cos(2*pi*f*x)",
    xLabel: "Time",
    xUnit: "s",
    yLabel: "Displacement",
    yUnit: "m",
    formula: "x(t) = A·e^(−bt)·cos(2πf·t)",
    blurb: "An oscillation that loses energy and fades away.",
    variables: [
      { key: "A", label: "Amplitude", unit: "m", min: 0.1, max: 5, step: 0.1, default: 3 },
      { key: "f", label: "Frequency", unit: "Hz", min: 0.1, max: 5, step: 0.05, default: 1 },
      { key: "b", label: "Damping", unit: "1/s", min: 0, max: 2, step: 0.02, default: 0.3 },
    ],
    xMax: "10",
    meaning: { period: "The wiggles keep the same spacing while the envelope shrinks exponentially." },
  },
  {
    id: "wave-speed",
    name: "Wave speed vs Wavelength",
    topic: "Waves & Oscillation",
    expr: "f*x",
    xLabel: "Wavelength",
    xUnit: "m",
    yLabel: "Wave speed",
    yUnit: "m/s",
    formula: "v = f·λ",
    blurb: "At a fixed frequency, longer waves travel faster.",
    variables: [{ key: "f", label: "Frequency", unit: "Hz", min: 1, max: 500, step: 1, default: 100 }],
    xMax: "5",
    meaning: { slope: "The slope is the frequency of the wave." },
  },

  // ---------------- Electricity ----------------
  {
    id: "ohm",
    name: "Voltage vs Current (Ohm's law)",
    topic: "Electricity",
    expr: "R*x",
    xLabel: "Current",
    xUnit: "A",
    yLabel: "Voltage",
    yUnit: "V",
    formula: "V = I·R",
    blurb: "A resistor turns current into a proportional voltage drop.",
    variables: [{ key: "R", label: "Resistance", unit: "Ω", min: 1, max: 500, step: 1, default: 100 }],
    xMax: "0.5",
    meaning: {
      slope: "The slope is the resistance. A steeper line means a bigger resistor.",
      area: "The area under the line relates to the energy per unit charge delivered.",
    },
  },
  {
    id: "power-current",
    name: "Power vs Current",
    topic: "Electricity",
    expr: "x^2*R",
    xLabel: "Current",
    xUnit: "A",
    yLabel: "Power",
    yUnit: "W",
    formula: "P = I²·R",
    blurb: "Heating in a resistor grows with the square of the current.",
    variables: [{ key: "R", label: "Resistance", unit: "Ω", min: 1, max: 100, step: 1, default: 10 }],
    xMax: "5",
    meaning: { curvature: "The curve steepens because power depends on current squared." },
  },
  {
    id: "rc-charge",
    name: "Capacitor voltage vs Time (RC charging)",
    topic: "Electricity",
    expr: "V0*(1 - exp(-x/(R*C)))",
    xLabel: "Time",
    xUnit: "s",
    yLabel: "Voltage",
    yUnit: "V",
    formula: "V(t) = V₀(1 − e^(−t/RC))",
    blurb: "A capacitor fills up quickly at first, then creeps toward the supply voltage.",
    variables: [
      { key: "V0", label: "Supply voltage", unit: "V", min: 1, max: 24, step: 0.5, default: 9 },
      { key: "R", label: "Resistance", unit: "kΩ", min: 0.1, max: 10, step: 0.1, default: 1 },
      { key: "C", label: "Capacitance", unit: "mF", min: 0.1, max: 10, step: 0.1, default: 1 },
    ],
    xMax: "20",
    meaning: {
      curvature: "The flattening curve is exponential approach — it never quite reaches the top.",
      slope: "The slope is the charging current times 1/C, largest at the very start.",
    },
  },

  // ---------------- Thermodynamics & Gases ----------------
  {
    id: "boyle",
    name: "Pressure vs Volume (Boyle's law)",
    topic: "Thermodynamics & Gases",
    expr: "n*8.314*T/x",
    xLabel: "Volume",
    xUnit: "L",
    yLabel: "Pressure",
    yUnit: "kPa",
    formula: "P = nRT / V",
    blurb: "Squeeze a gas into half the space and the pressure doubles.",
    variables: [
      { key: "n", label: "Amount of gas", unit: "mol", min: 0.1, max: 5, step: 0.1, default: 1 },
      { key: "T", label: "Temperature", unit: "K", min: 100, max: 800, step: 5, default: 300 },
    ],
    xMin: "0.5",
    xMax: "20",
    meaning: { curvature: "This hyperbola shows an inverse relationship: P × V stays constant." },
  },
  {
    id: "charles",
    name: "Volume vs Temperature (Charles's law)",
    topic: "Thermodynamics & Gases",
    expr: "n*8.314*x/P",
    xLabel: "Temperature",
    xUnit: "K",
    yLabel: "Volume",
    yUnit: "L",
    formula: "V = nRT / P",
    blurb: "Heat a gas at constant pressure and it expands in a straight line.",
    variables: [
      { key: "n", label: "Amount of gas", unit: "mol", min: 0.1, max: 5, step: 0.1, default: 1 },
      { key: "P", label: "Pressure", unit: "kPa", min: 10, max: 500, step: 5, default: 100 },
    ],
    xMax: "600",
    meaning: { intercept: "Extend the line back and it hits zero volume at absolute zero (0 K)." },
  },
  {
    id: "cooling",
    name: "Temperature vs Time (Newton's cooling)",
    topic: "Thermodynamics & Gases",
    expr: "Ta + (T0 - Ta)*exp(-k*x)",
    xLabel: "Time",
    xUnit: "min",
    yLabel: "Temperature",
    yUnit: "°C",
    formula: "T(t) = T_a + (T₀ − T_a)·e^(−kt)",
    blurb: "A hot drink cools fast at first, then slows as it nears room temperature.",
    variables: [
      { key: "T0", label: "Start temperature", unit: "°C", min: 0, max: 100, step: 1, default: 90 },
      { key: "Ta", label: "Room temperature", unit: "°C", min: -10, max: 40, step: 1, default: 20 },
      { key: "k", label: "Cooling rate", unit: "1/min", min: 0.01, max: 1, step: 0.01, default: 0.15 },
    ],
    xMax: "40",
    meaning: { curvature: "Exponential decay toward the room temperature asymptote." },
  },
  {
    id: "maxwell",
    name: "Blackbody-style intensity vs Wavelength",
    topic: "Thermodynamics & Gases",
    expr: "S*(1/(x^5))*(1/(exp(14388/(x*T)) - 1))",
    xLabel: "Wavelength",
    xUnit: "µm",
    yLabel: "Relative intensity",
    formula: "I ∝ 1/λ⁵ · 1/(e^(hc/λkT) − 1)",
    blurb: "Hotter objects glow brighter and peak at shorter wavelengths.",
    variables: [
      { key: "T", label: "Temperature", unit: "K", min: 500, max: 8000, step: 50, default: 3000 },
      { key: "S", label: "Scale", min: 1, max: 1000, step: 1, default: 100 },
    ],
    xMin: "0.1",
    xMax: "8",
    meaning: { curvature: "The peak shifts left as temperature rises (Wien's law)." },
  },

  // ---------------- Fluids ----------------
  {
    id: "pressure-depth",
    name: "Pressure vs Depth",
    topic: "Fluids",
    expr: "P0 + rho*g*x/1000",
    xLabel: "Depth",
    xUnit: "m",
    yLabel: "Pressure",
    yUnit: "kPa",
    formula: "P = P₀ + ρ·g·h",
    blurb: "Pressure in a liquid rises steadily with depth.",
    variables: [
      { key: "P0", label: "Surface pressure", unit: "kPa", min: 0, max: 200, step: 1, default: 101 },
      { key: "rho", label: "Density", unit: "kg/m³", min: 500, max: 14000, step: 10, default: 1000 },
      { key: "g", label: "Gravity", unit: "m/s²", min: 1, max: 25, step: 0.1, default: 9.81 },
    ],
    xMax: "100",
    meaning: { slope: "The slope is ρg — denser liquids build pressure faster." },
  },
  {
    id: "terminal",
    name: "Falling speed vs Time (with drag)",
    topic: "Fluids",
    expr: "vt*tanh(g*x/vt)",
    xLabel: "Time",
    xUnit: "s",
    yLabel: "Speed",
    yUnit: "m/s",
    formula: "v(t) = v_t·tanh(g·t / v_t)",
    blurb: "Air resistance flattens the speed curve at terminal velocity.",
    variables: [
      { key: "vt", label: "Terminal velocity", unit: "m/s", min: 5, max: 100, step: 1, default: 50 },
      { key: "g", label: "Gravity", unit: "m/s²", min: 1, max: 25, step: 0.1, default: 9.81 },
    ],
    xMax: "20",
    meaning: { curvature: "The curve flattens as drag grows to match weight." },
  },

  // ---------------- Optics ----------------
  {
    id: "lens",
    name: "Image distance vs Object distance",
    topic: "Optics",
    expr: "1/(1/f - 1/x)",
    xLabel: "Object distance",
    xUnit: "cm",
    yLabel: "Image distance",
    yUnit: "cm",
    formula: "1/f = 1/u + 1/v",
    blurb: "Thin lens equation — watch what happens at the focal length.",
    variables: [{ key: "f", label: "Focal length", unit: "cm", min: 2, max: 50, step: 1, default: 10 }],
    xMin: "1",
    xMax: "60",
    meaning: { curvature: "There is an asymptote at the focal length — the image runs off to infinity." },
  },
  {
    id: "intensity-distance",
    name: "Light intensity vs Distance",
    topic: "Optics",
    expr: "P/(4*pi*x^2)",
    xLabel: "Distance",
    xUnit: "m",
    yLabel: "Intensity",
    yUnit: "W/m²",
    formula: "I = P / (4πr²)",
    blurb: "Light spreads over a sphere, so intensity drops with the square of distance.",
    variables: [{ key: "P", label: "Source power", unit: "W", min: 1, max: 500, step: 1, default: 60 }],
    xMin: "0.2",
    xMax: "15",
    meaning: { curvature: "Another inverse-square law." },
  },

  // ---------------- Chemistry ----------------
  {
    id: "first-order",
    name: "Concentration vs Time (1st-order reaction)",
    topic: "Chemistry",
    expr: "C0*exp(-k*x)",
    xLabel: "Time",
    xUnit: "s",
    yLabel: "Concentration",
    yUnit: "mol/L",
    formula: "[A] = [A]₀·e^(−kt)",
    blurb: "In a first-order reaction, concentration halves in a fixed time no matter where you start.",
    variables: [
      { key: "C0", label: "Initial concentration", unit: "mol/L", min: 0.1, max: 5, step: 0.1, default: 1 },
      { key: "k", label: "Rate constant", unit: "1/s", min: 0.01, max: 1, step: 0.01, default: 0.15 },
    ],
    xMax: "40",
    meaning: {
      curvature: "Exponential decay — the half-life is ln2 / k and never changes.",
      slope: "The slope is the reaction rate, steepest at the start.",
    },
  },
  {
    id: "rate-conc",
    name: "Reaction rate vs Concentration",
    topic: "Chemistry",
    expr: "k*x^n",
    xLabel: "Concentration",
    xUnit: "mol/L",
    yLabel: "Rate",
    yUnit: "mol/L·s",
    formula: "rate = k·[A]ⁿ",
    blurb: "The reaction order n decides the shape: flat, straight, or curving up.",
    variables: [
      { key: "k", label: "Rate constant", min: 0.01, max: 5, step: 0.01, default: 1 },
      { key: "n", label: "Reaction order", min: 0, max: 3, step: 1, default: 1, note: "0 = flat, 1 = straight, 2 = curve" },
    ],
    xMax: "5",
    meaning: { curvature: "Order 2 curves upward; order 0 is a horizontal line." },
  },
  {
    id: "arrhenius",
    name: "Rate constant vs Temperature (Arrhenius)",
    topic: "Chemistry",
    expr: "A*exp(-Ea*1000/(8.314*x))",
    xLabel: "Temperature",
    xUnit: "K",
    yLabel: "Rate constant",
    formula: "k = A·e^(−Eₐ/RT)",
    blurb: "A small temperature rise can multiply the reaction rate.",
    variables: [
      { key: "A", label: "Pre-exponential factor", min: 1, max: 1e6, step: 1000, default: 100000 },
      { key: "Ea", label: "Activation energy", unit: "kJ/mol", min: 5, max: 150, step: 1, default: 50 },
    ],
    xMin: "200",
    xMax: "800",
    meaning: { curvature: "The steep rise shows why heating speeds reactions up so dramatically." },
  },
  {
    id: "ph",
    name: "pH vs Concentration of H⁺",
    topic: "Chemistry",
    expr: "-log10(x*10^(-p))",
    xLabel: "H⁺ concentration",
    xUnit: "×10⁻ᵖ mol/L",
    yLabel: "pH",
    formula: "pH = −log₁₀[H⁺]",
    blurb: "A logarithmic scale: each pH step is a factor of ten in acidity.",
    variables: [{ key: "p", label: "Power of ten (10⁻ᵖ)", min: 1, max: 12, step: 1, default: 3 }],
    xMin: "0.1",
    xMax: "10",
    meaning: { curvature: "Logarithmic — big concentration changes give small pH changes." },
  },
  {
    id: "titration",
    name: "pH vs Volume of base (titration)",
    topic: "Chemistry",
    expr: "pKa + log10((x + 0.001)/(Ve - x + 0.001))",
    xLabel: "Volume of base added",
    xUnit: "mL",
    yLabel: "pH",
    formula: "pH = pKa + log([A⁻]/[HA])",
    blurb: "The classic S-curve with a steep jump at the equivalence point.",
    variables: [
      { key: "pKa", label: "pKa of acid", min: 1, max: 12, step: 0.1, default: 4.8 },
      { key: "Ve", label: "Equivalence volume", unit: "mL", min: 5, max: 50, step: 1, default: 25 },
    ],
    xMin: "0.1",
    xMax: "25",
    meaning: { slope: "The flat middle is the buffer region; the steep part is the equivalence point." },
  },

  {
    id: "raoult-total",
    name: "Total vapour pressure vs Mole fraction of solute (Raoult's law)",
    topic: "Chemistry",
    expr: "P0*(1 - x)",
    xLabel: "Mole fraction of solute",
    yLabel: "Total vapour pressure",
    yUnit: "mm Hg",
    formula: "P = P° · (1 − x_solute)",
    blurb:
      "A non-volatile solute contributes no vapour of its own, so the total pressure is just the solvent's pressure, lowered in proportion to how much solute you dissolve.",
    derivation: [
      "Raoult's law for each component: the partial pressure of a component equals its pure vapour pressure times its mole fraction in the liquid — P_A = P°_A · x_A.",
      "The solute is non-volatile, so its own vapour pressure P°_B = 0 and therefore its partial pressure P_B = 0.",
      "Total pressure is the sum of the partial pressures: P_total = P_A + P_B = P°_solvent · x_solvent + 0.",
      "Mole fractions add to one: x_solvent = 1 − x_solute.",
      "Substituting gives P_total = P° · (1 − x_solute) — a straight line falling from P° at x = 0 to zero at x = 1.",
      "Rearranged, (P° − P)/P° = x_solute: the relative lowering of vapour pressure equals the mole fraction of solute (a colligative property).",
    ],
    variables: [
      { key: "P0", label: "Pure solvent vapour pressure P°", unit: "mm Hg", min: 10, max: 800, step: 5, default: 760, note: "The y-intercept of the line." },
    ],
    xMin: "0",
    xMax: "1",
    meaning: {
      slope: "The slope is −P°: every extra bit of solute lowers the pressure by the same amount.",
      intercept: "At x = 0 (pure solvent) the pressure is P° itself.",
    },
    keywords: ["raoult", "mole fraction", "vapour pressure", "colligative", "solution", "non-volatile"],
  },

  // ---------------- Math ----------------
  {
    id: "custom",
    name: "Custom function y = f(x)",

    topic: "Math functions",
    expr: "a*sin(b*x) + c",
    xLabel: "x",
    yLabel: "y",
    formula: "y = f(x)",
    blurb: "Type any equation you like — use x plus the parameters a, b, c.",
    variables: [
      { key: "a", label: "a", min: -10, max: 10, step: 0.1, default: 2 },
      { key: "b", label: "b", min: -10, max: 10, step: 0.1, default: 1 },
      { key: "c", label: "c", min: -10, max: 10, step: 0.1, default: 0 },
    ],
    xMin: "-10",
    xMax: "10",
  },
  {
    id: "quadratic",
    name: "Quadratic y = ax² + bx + c",
    topic: "Math functions",
    expr: "a*x^2 + b*x + c",
    xLabel: "x",
    yLabel: "y",
    formula: "y = ax² + bx + c",
    blurb: "The parabola. Change a to flip or squash it.",
    variables: [
      { key: "a", label: "a", min: -5, max: 5, step: 0.1, default: 1 },
      { key: "b", label: "b", min: -10, max: 10, step: 0.1, default: 0 },
      { key: "c", label: "c", min: -10, max: 10, step: 0.1, default: -4 },
    ],
    xMin: "-10",
    xMax: "10",
    meaning: {
      curvature: "a controls the curvature: positive opens upward, negative opens downward.",
      intercept: "c is where the curve crosses the y-axis.",
    },
  },
  {
    id: "exponential",
    name: "Exponential growth & decay",
    topic: "Math functions",
    expr: "A*exp(r*x)",
    xLabel: "x",
    yLabel: "y",
    formula: "y = A·e^(rx)",
    blurb: "Positive r grows without limit; negative r decays toward zero.",
    variables: [
      { key: "A", label: "A (start value)", min: 0.1, max: 20, step: 0.1, default: 1 },
      { key: "r", label: "r (rate)", min: -1, max: 1, step: 0.01, default: 0.3 },
    ],
    xMin: "0",
    xMax: "20",
    meaning: { curvature: "Constant percentage change per step." },
  },
  {
    id: "logarithm",
    name: "Logarithm y = a·ln(x) + c",
    topic: "Math functions",
    expr: "a*ln(x) + c",
    xLabel: "x",
    yLabel: "y",
    formula: "y = a·ln(x) + c",
    blurb: "Grows quickly at first, then almost flattens out.",
    variables: [
      { key: "a", label: "a", min: -5, max: 5, step: 0.1, default: 1 },
      { key: "c", label: "c", min: -10, max: 10, step: 0.1, default: 0 },
    ],
    xMin: "0.1",
    xMax: "20",
    meaning: { curvature: "Concave down — each doubling of x adds the same amount." },
  },
  {
    id: "trig",
    name: "Sine wave y = A·sin(Bx + C)",
    topic: "Math functions",
    expr: "A*sin(B*x + C) + D",
    xLabel: "x",
    yLabel: "y",
    formula: "y = A·sin(Bx + C) + D",
    blurb: "Amplitude, frequency, phase and offset all in one.",
    variables: [
      { key: "A", label: "Amplitude A", min: -5, max: 5, step: 0.1, default: 1 },
      { key: "B", label: "Frequency B", min: 0.1, max: 5, step: 0.1, default: 1 },
      { key: "C", label: "Phase C", min: -3.14, max: 3.14, step: 0.05, default: 0 },
      { key: "D", label: "Offset D", min: -5, max: 5, step: 0.1, default: 0 },
    ],
    xMin: "-10",
    xMax: "10",
    meaning: { period: "The wave repeats every 2π/B along x." },
  },
  {
    id: "polar-rose",
    name: "Polar rose r = a·cos(k·θ)",
    topic: "Math functions",
    plot: "polar",
    expr: "a*cos(k*x)",
    xLabel: "x",
    yLabel: "y",
    formula: "r = a·cos(kθ)",
    blurb: "A polar plot: the radius depends on the angle.",
    variables: [
      { key: "a", label: "Size a", min: 0.5, max: 8, step: 0.1, default: 4 },
      { key: "k", label: "Petals k", min: 1, max: 10, step: 1, default: 5 },
    ],
    xMin: "0",
    xMax: "6.2832",
    meaning: { period: "Odd k gives k petals; even k gives 2k petals." },
  },
  {
    id: "lissajous",
    name: "Parametric Lissajous curve",
    topic: "Math functions",
    plot: "parametric",
    xExpr: "A*sin(a*x + d)",
    expr: "B*sin(b*x)",
    xLabel: "x",
    yLabel: "y",
    formula: "x = A·sin(at + δ), y = B·sin(bt)",
    blurb: "Two perpendicular oscillations combined.",
    variables: [
      { key: "A", label: "A", min: 1, max: 5, step: 0.1, default: 3 },
      { key: "B", label: "B", min: 1, max: 5, step: 0.1, default: 3 },
      { key: "a", label: "a", min: 1, max: 9, step: 1, default: 3 },
      { key: "b", label: "b", min: 1, max: 9, step: 1, default: 2 },
      { key: "d", label: "δ", min: 0, max: 3.14, step: 0.05, default: 1.57 },
    ],
    xMin: "0",
    xMax: "6.2832",
  },
];

/** Quantity → related modules, used by the "any two quantities" search. */
export const QUANTITY_ALIASES: Record<string, string[]> = {
  velocity: ["v-t", "s-t", "ke-v", "terminal"],
  speed: ["v-t", "ke-v", "terminal", "wave-speed"],
  time: ["v-t", "s-t", "a-t", "shm", "damped", "rc-charge", "cooling", "first-order", "terminal"],
  distance: ["s-t", "gravitation", "intensity-distance", "projectile"],
  acceleration: ["a-t", "f-a", "v-t"],
  force: ["hooke", "f-a", "gravitation"],
  extension: ["hooke"],
  mass: ["f-a", "ke-v", "gravitation"],
  energy: ["ke-v", "hooke"],
  pressure: ["boyle", "charles", "pressure-depth"],
  volume: ["boyle", "charles", "titration"],
  temperature: ["charles", "cooling", "arrhenius", "maxwell"],
  voltage: ["ohm", "rc-charge"],
  current: ["ohm", "power-current"],
  resistance: ["ohm", "power-current"],
  power: ["power-current", "intensity-distance"],
  charge: ["rc-charge"],
  concentration: ["first-order", "rate-conc", "ph", "titration"],
  rate: ["rate-conc", "arrhenius", "first-order"],
  ph: ["ph", "titration"],
  wavelength: ["wave-speed", "maxwell"],
  frequency: ["wave-speed", "shm", "trig"],
  displacement: ["shm", "damped", "s-t"],
  depth: ["pressure-depth"],
  intensity: ["intensity-distance", "maxwell"],
  light: ["lens", "intensity-distance"],
  angle: ["projectile", "polar-rose"],
  x: ["custom", "quadratic", "trig", "exponential", "logarithm"],
};

export function getModule(id: string): GraphModule {
  return MODULES.find((m) => m.id === id) ?? MODULES[0]!;
}
