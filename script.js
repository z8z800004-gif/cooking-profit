const R_KEY = '띵타이쿤_요리데이터';
const I_KEY = '띵타이쿤_재료데이터';

let recipes = [];
let ingredients = {};

// -------------- 데이터 로드 -------------- //
async function loadData() {
  try {
    const [r, i] = await Promise.all([
      fetch('recipes.json'),
      fetch('ingredients.json')
    ]);
    recipes = await r.json();
    ingredients = await i.json();

    saveLocal();
    renderAll();
  } catch (e) {
    alert('데이터 로드 실패');
    console.error(e);
  }
}

// -------------- LocalStorage -------------- //
function saveLocal() {
  localStorage.setItem(R_KEY, JSON.stringify(recipes));
  localStorage.setItem(I_KEY, JSON.stringify(ingredients));
}

function loadLocal() {
  const r = localStorage.getItem(R_KEY);
  const i = localStorage.getItem(I_KEY);
  if (r && i) {
    recipes = JSON.parse(r);
    ingredients = JSON.parse(i);
    renderAll();
  } else {
    console.log('LocalStorage 비어 있음');
  }
}

function resetLocal() {
  localStorage.removeItem(R_KEY);
  localStorage.removeItem(I_KEY);
  alert('초기화 완료');
  location.reload();
}

// -------------- 원가 계산 -------------- //
function calcCost(name) {
  // 직접 가격이 정의된 경우 (씨앗·기타)
  for (const cat of Object.values(ingredients)) {
    if (cat[name]?.가격 !== undefined && !cat[name]?.구성) {
      return cat[name].가격;
    }
  }

  // 베이스의 경우 (재귀 계산)
  const baseInfo = ingredients['베이스']?.[name];
  if (baseInfo) {
    let total = 0;
    for (const [sub, cnt] of Object.entries(baseInfo.구성)) {
      const subCost = calcCost(sub);
      const subInfo = findIngredient(sub);

      // 수확량 고려 (씨앗 → 작물)
      const harvest = subInfo?.수확량 ?? 1;
      const cropCost = subCost / harvest;

      // 작물 8개 모아 베이스 1개 조합 (필요작물수 고려)
      total += cropCost * (baseInfo.필요작물수 ?? 8) * cnt;
    }

    // 조합량(=결과물 수량) 고려
    return total / (baseInfo.조합량 ?? 1);
  }

  console.warn('가격정보 없음:', name);
  return 0;
}

// 재료 탐색 유틸
function findIngredient(name) {
  for (const group of Object.values(ingredients)) {
    if (group[name]) return group[name];
  }
  return null;
}


// -------------- 렌더링 -------------- //
function renderRecipeTable() {
  const tbody = document.querySelector('#recipe-table tbody');
  tbody.innerHTML = '';
  recipes.forEach(r => {
    const cost = getRecipeCost(r);
    const avgPrice = (r.가격범위[0] + r.가격범위[1]) / 2;
    const profit = avgPrice - cost;
    const margin = cost ? ((profit / cost) * 100).toFixed(1) : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.이름}</td>
      <td>${r.가격범위[0]}~${r.가격범위[1]}</td>
      <td>${Object.entries(r.재료).map(([k,v])=>`${k}x${v}`).join(', ')}</td>
      <td>${cost.toFixed(1)}</td>
      <td>${profit.toFixed(1)}</td>
      <td>${margin}%</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderIngredientTable() {
  const tbody = document.querySelector('#ingredient-table tbody');
  tbody.innerHTML = '';
  Object.entries(ingredients).forEach(([cat, group]) => {
    Object.entries(group).forEach(([name, info]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cat}</td>
        <td>${name}</td>
        <td><input type="number" value="${info.가격 ?? 0}" data-cat="${cat}" data-name="${name}" class="price-input"></td>
        <td>${info.수확량 ?? '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  });

  // 가격 입력 변경 시 즉시 반영
  document.querySelectorAll('.price-input').forEach(input => {
    input.addEventListener('input', e => {
      const cat = e.target.dataset.cat;
      const name = e.target.dataset.name;
      const val = parseFloat(e.target.value) || 0;
      ingredients[cat][name].가격 = val;
      saveLocal();
      renderRecipeTable();
    });
  });
}

function renderAll() {
  renderRecipeTable();
  renderIngredientTable();
}

// -------------- 이벤트 연결 -------------- //
document.getElementById('load-data').addEventListener('click', loadData);
document.getElementById('reset-local').addEventListener('click', resetLocal);

// 초기화 시 자동 로드
window.addEventListener('DOMContentLoaded', loadLocal);
