const searchBar = document.querySelector('input');
const days = document.querySelectorAll('#specific-day');

document.querySelectorAll('button').forEach(element => {
  if (element.dataset.dropdown === 'units') {
    element.addEventListener('click', () => {
      document.getElementById('wheel-units').classList.toggle('rotate-[-60deg]');
      document.getElementById('js-switch-dropdown').classList.toggle('hidden');
    });
  };
});

document.querySelectorAll('#js-search-suggestions').forEach(input => {
  input.onclick = () => {
    searchBar.value = input.textContent;
    submitSearch();
  }
})

searchBar.addEventListener('click', () => {
  if (document.getElementById('suggestion-box').classList.contains('hidden')) {
    document.getElementById('suggestion-box').classList.remove('hidden');
  } else {
    document.getElementById('suggestion-box').classList.add('hidden');
  }
})

function submitSearch() {
  document.getElementById('suggestion-box').classList.add('hidden');
}

document.getElementById('js-day-dropdown-button').addEventListener('click', () => {
  document.getElementById('js-day-dropdown').classList.toggle('hidden');
  
});

// Function to toggle Weather hourly through day
days.forEach(day => {
  day.addEventListener('click', () => {
    const dayText = day.querySelector('p').textContent;

    document.getElementById('selected-day').textContent = dayText;
    document.getElementById('js-day-dropdown').classList.add('hidden');
  });
});



// const fetchAPI = async () => {
//   const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m');
//   const data = await response.json();
//   console.table(data);
// }

// fetchAPI();

// Function to switch units
function switchUnits(el) {
  if (el.querySelector('img').classList.contains('hidden')) {
    el.querySelector('img').classList.remove('hidden');
    el.classList.toggle('active-unit');

    const nextEl = el.nextElementSibling;
    const prevEl = el.previousElementSibling;

    if (!nextEl) {
      console.log((prevEl));
      prevEl.classList.toggle('active-unit');
      prevEl.querySelector('img').classList.toggle('hidden'); 

    } else {
      console.log(nextEl);
      nextEl.classList.toggle('active-unit');
      nextEl.querySelector('img').classList.toggle('hidden');        
    }

  } else {
    return;
  }
}

document.querySelectorAll('button').forEach(element => {
  element.onclick = () => {
    if (element.dataset.temps || element.dataset.windSpeed || element.dataset.precipitate) {
      console.log(element);

      switchUnits(element);
    }
  }
});

