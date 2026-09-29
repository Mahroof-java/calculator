const screen = document.getElementById("screen");
const previous = document.getElementById("previous");
const result = document.getElementById("result");
const buttons = document.querySelector(".buttons");

let expression = "";
let justCalculated = false;

// Display the current expression
function updateScreen() {
  screen.value = expression || "0";
  result.textContent = "";
  previous.textContent = "";

  if (expression === "") return;

  try {
    const answer = calculate(expression);
    result.textContent = "= " + format(answer);
  } catch (error) {
    // Incomplete expressions are normal while typing
  }
}

// Format decimal results
function format(number) {
  if (!Number.isFinite(number)) {
    return "Error";
  }

  return Number(number.toPrecision(12)).toString();
}

// Calculate using operator precedence
function calculate(input) {
  const tokens = input.match(/(?:\d+\.?\d*|\.\d+)|[+\-*/]/g);

  if (!tokens || tokens.join("") !== input) {
    throw new Error("Invalid expression");
  }

  const values = [];
  const operators = [];
  let expectingNumber = true;

  function applyOperator() {
    const op = operators.pop();
    const b = values.pop();
    const a = values.pop();

    if (a === undefined || b === undefined) {
      throw new Error("Incomplete expression");
    }

    if (op === "+") values.push(a + b);
    if (op === "-") values.push(a - b);
    if (op === "*") values.push(a * b);

    if (op === "/") {
      if (b === 0) throw new Error("Division by zero");
      values.push(a / b);
    }
  }

  function precedence(op) {
    return op === "*" || op === "/" ? 2 : 1;
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (!isNaN(token)) {
      if (!expectingNumber) {
        throw new Error("Missing operator");
      }

      values.push(Number(token));
      expectingNumber = false;
    } else {
      // Support negative numbers
      if (expectingNumber) {
        if (token === "-" || token === "+") {
          if (token === "-") {
            values.push(0);
            operators.push("-");
          }
          continue;
        }
        throw new Error("Invalid operator");
      }

      while (
        operators.length &&
        precedence(operators[operators.length - 1]) >= precedence(token)
      ) {
        applyOperator();
      }

      operators.push(token);
      expectingNumber = true;
    }
  }

  if (expectingNumber) {
    throw new Error("Incomplete expression");
  }

  while (operators.length) {
    applyOperator();
  }

  if (values.length !== 1 || !Number.isFinite(values[0])) {
    throw new Error("Invalid result");
  }

  return values[0];
}

// Add a number or operator
function addValue(value) {
  if (justCalculated) {
    if ("+-*/".includes(value)) {
      justCalculated = false;
    } else {
      expression = "";
      justCalculated = false;
    }
  }

  const last = expression.slice(-1);

  if ("+-*/".includes(value)) {
    if (expression === "") {
      if (value !== "-") return;
    }

    if ("+-*/".includes(last)) {
      expression = expression.slice(0, -1);
    }
  }

  if (value === ".") {
    const currentNumber = expression.split(/[+\-*/]/).pop();
    if (currentNumber.includes(".")) return;

    if (currentNumber === "") {
      expression += "0";
    }
  }

  expression += value;
  updateScreen();
}

// Clear everything
function clearScreen() {
  expression = "";
  justCalculated = false;
  updateScreen();
}

// Delete the last character
function deleteLast() {
  expression = expression.slice(0, -1);
  justCalculated = false;
  updateScreen();
}

// Show the final answer
function showResult() {
  if (!expression) return;

  try {
    const answer = calculate(expression);
    previous.textContent = expression + " =";
    expression = format(answer);
    screen.value = expression;
    result.textContent = "";
    justCalculated = true;
  } catch (error) {
    result.textContent =
      error.message === "Division by zero"
        ? "Cannot divide by zero"
        : "Invalid expression";
  }
}

// Handle calculator button clicks
buttons.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) return;

  const value = button.dataset.value;
  const action = button.dataset.action;

  if (action === "clear") {
    clearScreen();
  } else if (action === "delete") {
    deleteLast();
  } else if (action === "equals") {
    showResult();
  } else if (value !== undefined) {
    addValue(value);
  }
});

// Keyboard support
document.addEventListener("keydown", function (event) {
  const key = event.key;

  if (/^[0-9.]$/.test(key)) {
    addValue(key);
  } else if (["+", "-", "*", "/"].includes(key)) {
    addValue(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    showResult();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape") {
    clearScreen();
  }
});

updateScreen();
