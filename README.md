# Graph Explorer

# Website Build Prompt: Interactive Quantity-Relationship Graphing Tool

Copy everything below into your AI website builder.

---

Build a web app for students to explore relationships between physical/mathematical quantities through interactive graphs. Core idea: the user picks two quantities (e.g. velocity and time, distance and time, force and acceleration), the app plots their relationship, lets the user adjust variables live, and explains what's happening in plain language.

## 1. Layout

- Left sidebar (or top tab bar on mobile): a searchable list of "graph modules," grouped by topic (Kinematics, Dynamics, Waves, Circuits, Thermodynamics, Math functions, etc.)

- Main panel split into three sections:

  1. **Quantity selector** — two dropdowns (or a single "X vs Y" picker) where the user chooses the quantities to plot. Selecting a known pair (e.g. v–t) auto-loads its formula and default variables.

  2. **Live graph** — updates in real time as sliders/inputs change. Show axis labels with units, gridlines, and a draggable point or cursor that reports live (x, y) values.

  3. **Variable control panel** — sliders + numeric inputs for every parameter in the underlying equation (e.g. for v–t: initial velocity, acceleration, time range). Include reset-to-default and randomize buttons.

- Below the graph: an **explanation panel** that dynamically updates text describing:

  - What the graph currently shows (slope, curvature, intercepts)

  - What that means physically (e.g. "slope = acceleration," "area under curve = displacement")

  - What changed since the last variable tweak, in plain language

## 2. Hard requirement: not limited to a fixed list

The preset modules in Section 3 are just a starting library — the app must NOT be restricted to only those pairs. The core engine must be general enough to graph **any relationship in math, physics, or chemistry**, including ones not pre-programmed. Concretely:

- If the user types or selects two quantities that aren't in the preset list, the app should still attempt to plot them using either:

  - A known formula from a built-in science/math relationship database (expand this database broadly — mechanics, electricity & magnetism, waves/optics, thermodynamics, fluid dynamics, algebra, trigonometry, calculus, chemical kinetics, gas laws, equilibrium, pH/concentration curves, reaction rate vs. concentration/temperature, etc.), or

  - A free-form equation the user enters directly (y = f(x), or implicit/parametric forms), or

  - A description-to-formula step where the user names two quantities in plain words and the app infers/asks for the likely relationship before plotting

- Treat the preset list as an expandable library, not a hardcoded limit — new quantity pairs should be addable as data entries, not new code

- Support multiple graph types beyond simple line plots where relevant: curves, exponential/log plots, periodic/oscillating functions, parametric and polar plots, and multi-variable relationships (e.g. plotting y vs x at a fixed z, with a slider for z)

- If a requested pair truly has no standard defined relationship, the app should say so clearly rather than silently failing, and suggest the closest related quantities it can plot

## 3. Starter set of quantity pairs to include

- Velocity vs Time (v–t): slope = acceleration, area = displacement

- Distance vs Time (s–t): slope = velocity

- Acceleration vs Time (a–t): area = change in velocity

- Force vs Extension (Hooke's law)

- Force vs Acceleration (Newton's 2nd law, mass as variable)

- Pressure vs Volume (Boyle's law)

- Voltage vs Current (Ohm's law)

- Position vs Time for a pendulum/SHM

- A generic "custom function" mode where the user types any y = f(x) and it plots + explains slope/curvature

## 4. Explanation engine

For each module (preset or user-entered), define or infer:

- The governing equation

- Rules for what each visual feature (slope, intercept, curvature, area, periodicity) represents physically/chemically/mathematically

- Template sentences that fill in current values, e.g.: "Because acceleration is 2 m/s², the line rises by 2 m/s every second."

For free-form or non-preset equations, fall back to general math language (slope, rate of change, concavity, roots, asymptotes) when a domain-specific meaning isn't available.

Explanation text should update instantly when a slider moves — no page reload.

## 5. Interactivity requirements

- All variable changes reflect on the graph within ~100ms (no submit button)

- Sliders should have sensible min/max/step per variable, with the option to type an exact number

- Support at least: line graphs, and where relevant, animated point motion (e.g. a dot moving along a v–t derived position)

- Add a "compare" mode: overlay a second curve (e.g. two different accelerations) with a legend

- Add unit toggles where relevant (m/s vs km/h, etc.)

## 6. Tech suggestions

- Frontend: React

- Charts: Recharts, Chart.js, or Plotly for the live graphs

- Keep each "module" (quantity pair) as a self-contained config object: `{ id, name, xLabel, yLabel, equation, variables[], explain(fn) }` so new topics can be added without touching core UI code

- Responsive design: sidebar collapses to a dropdown on mobile; controls stack under the graph

## 7. Tone and audience

- Written for high-school/early-college students — clear, simple language, no jargon without a short definition

- Visually clean, uncluttered, encouraging exploration (think Desmos/PhET-style, not a dense textbook page)

## 8. Nice-to-haves (only if time permits)

- Save/share a specific variable configuration via URL

- A quiz mode: app sets random variables, asks the student to predict slope/shape before revealing the graph

- Dark mode

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/307710b1-60ee-4ea0-b00c-ec461105d0dd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
