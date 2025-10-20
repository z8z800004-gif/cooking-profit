const STORAGE_KEY = '띵타이쿤_요리데이터';

// 테이블 렌더링
function renderTable(data) {
  const tbody = document.querySelector('#recipe-table tbody');
  tbody.innerHTML = '';
  data.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.이름}</td>
      <td>${item.가격범위[0]} ~ ${item.가격범위[1]} G</td>
      <td>${Object.entries(item.재료).map(([k,v])=>`${k} x${v}`).join(', ')}</td>
    `;
    tbody.appendChild(tr);
  });
}

// LocalStorage에서 불러오기
function loadFromLocal() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    console.error('저장된 데이터 파싱 실패');
    return null;
  }
}

// LocalStorage에 저장
function saveToLocal(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  alert('LocalStorage에 저장 완료');
}

// JSON에서 불러오기
async function loadFromJson() {
  try {
    const res = await fetch('recipes.json');
    const data = await res.json();
    saveToLocal(data);
    renderTable(data);
  } catch (err) {
    alert('JSON 불러오기 실패');
    console.error(err);
  }
}

// 초기화
function clearLocal() {
  localStorage.removeItem(STORAGE_KEY);
  alert('LocalStorage 초기화 완료');
  document.querySelector('#recipe-table tbody').innerHTML = '';
}

// 이벤트 연결
document.getElementById('load-json').addEventListener('click', loadFromJson);
document.getElementById('save-local').addEventListener('click', () => {
  const data = loadFromLocal();
  if (data) saveToLocal(data);
});
document.getElementById('clear-local').addEventListener('click', clearLocal);

// 페이지 로드시 자동 로드
window.addEventListener('DOMContentLoaded', () => {
  const localData = loadFromLocal();
  if (localData) {
    renderTable(localData);
  } else {
    console.log('LocalStorage 비어 있음. JSON 수동 불러오기 필요.');
  }
});
let recipes = [];
let ingredients = {};

// 파일 로드
async function loadAllData() {
  const [recipesRes, ingredientsRes] = await Promise.all([
    fetch('recipes.json'),
    fetch('ingredients.json')
  ]);
  recipes = await recipesRes.json();
  ingredients = await ingredientsRes.json();

  // 저장 후 표시
  localStorage.setItem('요리데이터', JSON.stringify(recipes));
  localStorage.setItem('재료데이터', JSON.stringify(ingredients));

  renderRecipeTableWithCost();
}

// 원가 계산
function calcCost(itemName) {
  // 1) 직접 가격 존재
  for (const group of Object.values(ingredients)) {
    if (group[itemName]?.가격 !== undefined) {
      return group[itemName].가격;
    }
  }

  // 2) 베이스 조합일 경우
  if (ingredients['베이스'][itemName]) {
    const info = ingredients['베이스'][itemName];
    let total = 0;
    for (const [sub, cnt] of Object.entries(info.구성)) {
      total += calcCost(sub) * cnt;
    }
    return total / (info.조합량 ?? 1);
  }

  console.warn('단가 미확인:', itemName);
  return 0;
}

// 요리 총원가 계산
function getRecipeCost(recipe) {
  let total = 0;
  for (const [mat, cnt] of Object.entries(recipe.재료)) {
    total += calcCost(mat) * cnt;
  }
  return total;
}

// 렌더링
function renderRecipeTableWithCost() {
  const tbody = document.querySelector('#recipe-table tbody');
  tbody.innerHTML = '';
  recipes.forEach(item => {
    const cost = getRecipeCost(item);
    const avgPrice = (item.가격범위[0] + item.가격범위[1]) / 2;
    const profit = avgPrice - cost;
    const margin = ((profit / cost) * 100).toFixed(1);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.이름}</td>
      <td>${item.가격범위[0]}~${item.가격범위[1]} G</td>
      <td>${Object.entries(item.재료).map(([k,v])=>`${k} x${v}`).join(', ')}</td>
      <td>${cost.toFixed(1)}</td>
      <td>${profit.toFixed(1)}</td>
      <td>${margin}%</td>
    `;
    tbody.appendChild(tr);
  });
}
