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
