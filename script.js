const form = document.querySelector("#transactionForm");
const transactionId = document.querySelector("#transactionId");
const descriptionInput = document.querySelector("#description");
const amountInput = document.querySelector("#amount");
const typeInput = document.querySelector("#type");
const categoryInput = document.querySelector("#category");
const dateInput = document.querySelector("#date");
const clearButton = document.querySelector("#clearButton");
const exportButton = document.querySelector("#exportButton");
const sampleButton = document.querySelector("#sampleButton");
const monthlyGoalInput = document.querySelector("#monthlyGoal");
const monthlyBudgetInput = document.querySelector("#monthlyBudget");
const monthFilter = document.querySelector("#monthFilter");
const searchInput = document.querySelector("#searchInput");
const table = document.querySelector("#transactionsTable");
const emptyState = document.querySelector("#emptyState");
const categoryChart = document.querySelector("#categoryChart");
const budgetChart = document.querySelector("#budgetChart");
const balanceElement = document.querySelector("#balance");
const incomeElement = document.querySelector("#income");
const expenseElement = document.querySelector("#expense");
const transactionCountElement = document.querySelector("#transactionCount");
const savingsRateElement = document.querySelector("#savingsRate");
const budgetUsageElement = document.querySelector("#budgetUsage");
const healthTitle = document.querySelector("#healthTitle");
const healthDescription = document.querySelector("#healthDescription");
const topCategory = document.querySelector("#topCategory");
const topCategoryDescription = document.querySelector("#topCategoryDescription");
const suggestionTitle = document.querySelector("#suggestionTitle");
const suggestionDescription = document.querySelector("#suggestionDescription");

const storageKey = "controle-financeiro-estudantil";
const settingsKey = "controle-financeiro-estudantil-config";
const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);
const categoryBudgets = {
  Transporte: 180,
  Alimentacao: 320,
  Faculdade: 250,
  Internet: 100,
  Lazer: 160,
  Outros: 120
};

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const defaultTransactions = [
  {
    id: createId(),
    description: "Bolsa de estudos",
    amount: 620,
    type: "income",
    category: "Bolsa/Estagio",
    date: `${currentMonth}-05`
  },
  {
    id: createId(),
    description: "Freelance landing page",
    amount: 280,
    type: "income",
    category: "Freelance",
    date: `${currentMonth}-07`
  },
  {
    id: createId(),
    description: "Transporte faculdade",
    amount: 146,
    type: "expense",
    category: "Transporte",
    date: `${currentMonth}-08`
  },
  {
    id: createId(),
    description: "Internet",
    amount: 89.9,
    type: "expense",
    category: "Internet",
    date: `${currentMonth}-10`
  },
  {
    id: createId(),
    description: "Almoco no campus",
    amount: 212.45,
    type: "expense",
    category: "Alimentacao",
    date: `${currentMonth}-13`
  },
  {
    id: createId(),
    description: "Material de estudo",
    amount: 78,
    type: "expense",
    category: "Faculdade",
    date: `${currentMonth}-16`
  },
  {
    id: createId(),
    description: "Cinema",
    amount: 42,
    type: "expense",
    category: "Lazer",
    date: `${currentMonth}-20`
  }
];

let transactions = JSON.parse(localStorage.getItem(storageKey)) || defaultTransactions;
let settings = JSON.parse(localStorage.getItem(settingsKey)) || {
  monthlyGoal: 250,
  monthlyBudget: 900
};

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function saveTransactions() {
  localStorage.setItem(storageKey, JSON.stringify(transactions));
}

function saveSettings() {
  settings.monthlyGoal = Number(monthlyGoalInput.value) || 0;
  settings.monthlyBudget = Number(monthlyBudgetInput.value) || 0;
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function getFilteredTransactions() {
  const selectedMonth = monthFilter.value;
  const search = searchInput.value.trim().toLowerCase();

  return transactions.filter((transaction) => {
    const matchesMonth = selectedMonth ? transaction.date.startsWith(selectedMonth) : true;
    const matchesSearch = [
      transaction.description,
      transaction.category,
      transaction.type
    ].some((field) => field.toLowerCase().includes(search));

    return matchesMonth && matchesSearch;
  });
}

function updateMetrics(filteredTransactions) {
  const income = filteredTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const expense = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
  const budgetUsage = settings.monthlyBudget > 0 ? Math.round((expense / settings.monthlyBudget) * 100) : 0;

  balanceElement.textContent = formatCurrency(balance);
  incomeElement.textContent = formatCurrency(income);
  expenseElement.textContent = formatCurrency(expense);
  transactionCountElement.textContent = filteredTransactions.length;
  savingsRateElement.textContent = `${savingsRate}%`;
  budgetUsageElement.textContent = `${budgetUsage}%`;

  updateInsights({ income, expense, balance, savingsRate, budgetUsage }, filteredTransactions);
}

function updateCategoryChart(filteredTransactions) {
  const expensesByCategory = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((summary, transaction) => {
      summary[transaction.category] = (summary[transaction.category] || 0) + transaction.amount;
      return summary;
    }, {});

  const entries = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
  const highestValue = Math.max(...entries.map((entry) => entry[1]), 1);

  if (!entries.length) {
    categoryChart.innerHTML = "<p class=\"empty-inline\">Sem despesas para exibir.</p>";
    return;
  }

  categoryChart.innerHTML = entries
    .map(([category, value]) => {
      const width = Math.max((value / highestValue) * 100, 8);

      return `
        <div class="bar-row">
          <span class="bar-label">${category}</span>
          <span class="bar-track">
            <span class="bar-fill" style="width: ${width}%"></span>
          </span>
          <span class="bar-value">${formatCurrency(value)}</span>
        </div>
      `;
    })
    .join("");
}

function updateBudgetChart(filteredTransactions) {
  const expensesByCategory = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((summary, transaction) => {
      summary[transaction.category] = (summary[transaction.category] || 0) + transaction.amount;
      return summary;
    }, {});

  const entries = Object.entries(categoryBudgets);

  budgetChart.innerHTML = entries
    .map(([category, budget]) => {
      const spent = expensesByCategory[category] || 0;
      const usage = Math.round((spent / budget) * 100);
      const width = Math.min(Math.max(usage, 5), 100);
      const statusClass = usage >= 90 ? "danger" : usage >= 70 ? "warn" : "safe";

      return `
        <div class="bar-row">
          <span class="bar-label">${category}</span>
          <span class="bar-track">
            <span class="bar-fill ${statusClass}" style="width: ${width}%"></span>
          </span>
          <span class="bar-value">${usage}%</span>
        </div>
      `;
    })
    .join("");
}

function updateInsights(metrics, filteredTransactions) {
  const expensesByCategory = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((summary, transaction) => {
      summary[transaction.category] = (summary[transaction.category] || 0) + transaction.amount;
      return summary;
    }, {});

  const orderedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
  const biggestCategory = orderedCategories[0];
  const goalDistance = settings.monthlyGoal - metrics.balance;

  if (!filteredTransactions.length) {
    healthTitle.textContent = "Sem dados suficientes";
    healthDescription.textContent = "Cadastre seus primeiros lancamentos para receber uma leitura automatica.";
  } else if (metrics.balance >= settings.monthlyGoal && settings.monthlyGoal > 0) {
    healthTitle.textContent = "Meta batida";
    healthDescription.textContent = `Voce ja passou da meta mensal em ${formatCurrency(metrics.balance - settings.monthlyGoal)}.`;
  } else if (metrics.balance > 0) {
    healthTitle.textContent = "Mes positivo";
    healthDescription.textContent = `Seu saldo esta positivo. Faltam ${formatCurrency(Math.max(goalDistance, 0))} para bater a meta.`;
  } else {
    healthTitle.textContent = "Atencao ao saldo";
    healthDescription.textContent = "As saidas passaram das entradas neste mes. Revise os maiores gastos.";
  }

  if (biggestCategory) {
    topCategory.textContent = biggestCategory[0];
    topCategoryDescription.textContent = `Maior gasto do mes: ${formatCurrency(biggestCategory[1])}.`;
  } else {
    topCategory.textContent = "-";
    topCategoryDescription.textContent = "Sem despesas cadastradas no periodo.";
  }

  if (metrics.budgetUsage >= 100) {
    suggestionTitle.textContent = "Reduzir despesas";
    suggestionDescription.textContent = "O limite mensal foi ultrapassado. Priorize gastos essenciais ate virar o mes.";
  } else if (biggestCategory && biggestCategory[0] === "Alimentacao") {
    suggestionTitle.textContent = "Planejar alimentacao";
    suggestionDescription.textContent = "Alimentacao lidera os gastos. Levar lanches ou marmita pode melhorar o saldo.";
  } else if (metrics.savingsRate < 15 && metrics.income > 0) {
    suggestionTitle.textContent = "Aumentar reserva";
    suggestionDescription.textContent = "Tente separar uma parte da renda assim que ela entrar.";
  } else {
    suggestionTitle.textContent = "Manter ritmo";
    suggestionDescription.textContent = "O mes esta controlado. Continue acompanhando os proximos lancamentos.";
  }
}

function renderTransactions() {
  const filteredTransactions = getFilteredTransactions();

  table.innerHTML = filteredTransactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((transaction) => {
      const moneyClass = transaction.type === "income" ? "money-income" : "money-expense";
      const signal = transaction.type === "income" ? "+" : "-";

      return `
        <tr>
          <td>
            <strong>${transaction.description}</strong><br>
            <small>${transaction.type === "income" ? "Entrada" : "Saida"}</small>
          </td>
          <td>${transaction.category}</td>
          <td>${formatDate(transaction.date)}</td>
          <td class="${moneyClass}">${signal} ${formatCurrency(transaction.amount)}</td>
          <td>
            <div class="row-actions">
              <button class="edit" type="button" data-action="edit" data-id="${transaction.id}">Editar</button>
              <button class="delete" type="button" data-action="delete" data-id="${transaction.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  emptyState.style.display = filteredTransactions.length ? "none" : "block";
  updateMetrics(filteredTransactions);
  updateCategoryChart(filteredTransactions);
  updateBudgetChart(filteredTransactions);
}

function clearForm() {
  transactionId.value = "";
  form.reset();
  dateInput.value = today;
  typeInput.value = "income";
  categoryInput.value = "Bolsa/Estagio";
  descriptionInput.focus();
}

function handleSubmit(event) {
  event.preventDefault();

  const transaction = {
    id: transactionId.value || createId(),
    description: descriptionInput.value.trim(),
    amount: Number(amountInput.value),
    type: typeInput.value,
    category: categoryInput.value,
    date: dateInput.value
  };

  if (transactionId.value) {
    transactions = transactions.map((item) => (item.id === transaction.id ? transaction : item));
  } else {
    transactions.push(transaction);
  }

  saveTransactions();
  renderTransactions();
  clearForm();
}

function handleTableClick(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const selectedTransaction = transactions.find((transaction) => transaction.id === button.dataset.id);

  if (!selectedTransaction) {
    return;
  }

  if (button.dataset.action === "edit") {
    transactionId.value = selectedTransaction.id;
    descriptionInput.value = selectedTransaction.description;
    amountInput.value = selectedTransaction.amount;
    typeInput.value = selectedTransaction.type;
    categoryInput.value = selectedTransaction.category;
    dateInput.value = selectedTransaction.date;
    descriptionInput.focus();
  }

  if (button.dataset.action === "delete") {
    const shouldDelete = confirm(`Excluir "${selectedTransaction.description}"?`);

    if (shouldDelete) {
      transactions = transactions.filter((transaction) => transaction.id !== selectedTransaction.id);
      saveTransactions();
      renderTransactions();
      clearForm();
    }
  }
}

function exportCsv() {
  const rows = [
    ["Descricao", "Valor", "Tipo", "Categoria", "Data"],
    ...getFilteredTransactions().map((transaction) => [
      transaction.description,
      transaction.amount.toFixed(2),
      transaction.type === "income" ? "Entrada" : "Saida",
      transaction.category,
      transaction.date
    ])
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "controle-financeiro-estudantil.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function loadSampleData() {
  transactions = defaultTransactions.map((transaction) => ({
    ...transaction,
    id: createId()
  }));
  saveTransactions();
  renderTransactions();
}

form.addEventListener("submit", handleSubmit);
table.addEventListener("click", handleTableClick);
clearButton.addEventListener("click", clearForm);
exportButton.addEventListener("click", exportCsv);
sampleButton.addEventListener("click", loadSampleData);
monthFilter.addEventListener("input", renderTransactions);
searchInput.addEventListener("input", renderTransactions);
monthlyGoalInput.addEventListener("input", () => {
  saveSettings();
  renderTransactions();
});
monthlyBudgetInput.addEventListener("input", () => {
  saveSettings();
  renderTransactions();
});

monthFilter.value = currentMonth;
dateInput.value = today;
monthlyGoalInput.value = settings.monthlyGoal;
monthlyBudgetInput.value = settings.monthlyBudget;
saveTransactions();
renderTransactions();
