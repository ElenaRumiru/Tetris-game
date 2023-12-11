//  Сделано по методу Стивена Ламберта
// https://gist.github.com/straker/3c98304f8a6a9174efd8292800891ea1
// Чтобы обойти сложности с фигурами, их движением при объектном подходе

// Находим нужные элементы
 const canvas = document.getElementById('game');
 const context = canvas.getContext('2d');
 const score = document.querySelector('.score');
 const bestScore = document.querySelector('.best-score');
 const restartBtn = document.querySelector('.restart');

 // При загрузке страницы возьмем сохраненное значение лучшего результата
 window.addEventListener('load', () => {
  saved = window.localStorage.getItem(bestScore); // после загрузки HTML и всех связанных ресурсов)
  bestScore.textContent = saved;
});

 // Определяем размер
 const grid = 32;
 // Задаем пустой массив с последовательностями фигур
 var tetrominoSequence = [];

 // С помощью двумерного массива следим за тем, что находится в каждой клетке игрового поля
 // размер поля — 10 на 20, и несколько строк ещё находится за видимой областью
 var playfield = [];

 // Заполняем сразу массив пустыми ячейками
 for (let row = -2; row < 20; row++) {
   playfield[row] = [];

   for (let col = 0; col < 10; col++) {
     playfield[row][col] = 0;
   }
 }
 // Получается поле 10 х 20

 // Как рисовать каждую фигуру бралось здесь
 // Отображение получается с помощью матриц
 // https://tetris.fandom.com/wiki/SRS
 const tetrominos = {
   'I': [
     [0,0,0,0],
     [1,1,1,1],
     [0,0,0,0],
     [0,0,0,0]
   ],
   'J': [
     [1,0,0],
     [1,1,1],
     [0,0,0],
   ],
   'L': [
     [0,0,1],
     [1,1,1],
     [0,0,0],
   ],
   'O': [
     [1,1],
     [1,1],
   ],
   'S': [
     [0,1,1],
     [1,1,0],
     [0,0,0],
   ],
   'Z': [
     [1,1,0],
     [0,1,1],
     [0,0,0],
   ],
   'T': [
     [0,1,0],
     [1,1,1],
     [0,0,0],
   ]
 };

 // Цвет каждой фигуры
 const colors = {
   'I': 'hotpink',
   'O': 'yellow',
   'T': 'blueviolet',
   'S': 'aquamarine',
   'Z': 'crimson',
   'J': 'greenyellow',
   'L': 'coral'
 };

 // счётчик
 let count = 0;
 // текущая фигура в игре
 let tetromino = getNextTetromino();
 // следим за кадрами анимации, чтобы если что — остановить игру
 let rAF = null;  
 // флаг конца игры, на старте — неактивный
 let gameOver = false;
 // Количество очков
 let scorePoints = 0;


 // Функция возвращает случайное число в заданном диапазоне
 // https://stackoverflow.com/a/1527820/2124254
 function getRandomInt(min, max) {
   min = Math.ceil(min);
   max = Math.floor(max);

   return Math.floor(Math.random() * (max - min + 1)) + min;
 }

 // Создаём последовательность фигур, которая появится в игре
 //https://tetris.fandom.com/wiki/Random_Generator
 function generateSequence() {
   // тут — сами фигуры
   const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

   while (sequence.length) {
     // случайным образом находим любую из них
     const rand = getRandomInt(0, sequence.length - 1);
     const name = sequence.splice(rand, 1)[0];
     // помещаем выбранную фигуру в игровой массив с последовательностями
     tetrominoSequence.push(name);
   }
 }

 // получаем следующую фигуру
 function getNextTetromino() {
   // если следующей нет — генерируем
   if (tetrominoSequence.length === 0) {
     generateSequence();
   }
   // Берём первую фигуру из массива
   const name = tetrominoSequence.pop();
   // Создаём матрицу, с которой мы отрисуем фигуру
   const matrix = tetrominos[name];

   // I и O стартуют с середины, остальные — чуть левее
   // Это оказалось очень важным при повороте фигур
   const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

   // I начинает с 21 строки (смещение -1), а другие — со строки 22 (смещение -2)
   const row = name === 'I' ? -1 : -2;

   // вот что возвращает функция 
   return {
     name: name,      // название фигуры (L, O, и т.д.)
     matrix: matrix,  // матрица с фигурой
     row: row,        // текущая строка (фигуры стартую за видимой областью холста)
     col: col         // текущий столбец
   };
 }

 // Поворачиваем матрицу на 90 градусов, взято отсюда
 // https://codereview.stackexchange.com/a/186834
 function rotate(matrix) {
   const N = matrix.length - 1;
   const result = matrix.map((row, i) =>
     row.map((val, j) => matrix[N - j][i])
   );
   // На входе матрица, и на выходе тоже отдаём матрицу
   return result;
 }

 // Проверяем после появления или вращения, может ли матрица (фигура) быть в этом месте поля или она вылезет за его границы
 function isValidMove(matrix, cellRow, cellCol) {
   // Проверяем все строки и столбцы
   for (let row = 0; row < matrix.length; row++) {
     for (let col = 0; col < matrix[row].length; col++) {
       if (matrix[row][col] && (
           // Если выходит за границы поля…
           cellCol + col < 0 ||
           cellCol + col >= playfield[0].length ||
           cellRow + row >= playfield.length ||
           // …или пересекается с другими фигурами
           playfield[cellRow + row][cellCol + col])
         ) {
         // то возвращаем, что так нельзя
         return false;
       }
     }
   }
   // а если мы дошли до этого момента и не закончили раньше — то всё в порядке
   return true;
 }

 // когда фигура окончательна встала на своё место
 function placeTetromino() {
   // обрабатываем все строки и столбцы в игровом поле
   for (let row = 0; row < tetromino.matrix.length; row++) {
     for (let col = 0; col < tetromino.matrix[row].length; col++) {
       if (tetromino.matrix[row][col]) {

         // если край фигуры после установки вылезает за границы поля, то игра закончилась
         if (tetromino.row + row < 0) {
           return showGameOver();
         }
         // если всё в порядке, то записываем в массив игрового поля нашу фигуру
         playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
       }
     } 
   }

   // проверяем, чтобы заполненные ряды очистились снизу вверх
   for (let row = playfield.length - 1; row >= 0; ) {
     // если ряд заполнен
     if (playfield[row].every(cell => !!cell)) {

       // очищаем его и опускаем всё вниз на одну клетку
       for (let r = row; r >= 0; r--) {
         for (let c = 0; c < playfield[r].length; c++) {
           playfield[r][c] = playfield[r-1][c];
         }
       }
      scorePoints += 250;
      score.textContent = scorePoints;
     }
     else {
       // переходим к следующему ряду
       row--;
     }
   }
   // получаем следующую фигуру
   tetromino = getNextTetromino();
 }

   // показываем надпись Game Over
   function showGameOver() {
     // прекращаем всю анимацию игры
     cancelAnimationFrame(rAF);
     // ставим флаг окончания
     gameOver = true;
     // рисуем чёрный прямоугольник посередине поля
     context.fillStyle = 'black';
     context.globalAlpha = 0.75;
     context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
     // пишем надпись белым моноширинным шрифтом по центру
     context.globalAlpha = 1;
     context.fillStyle = 'white';
     context.font = '36px monospace';
     context.textAlign = 'center';
     context.textBaseline = 'middle';
     context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
     let recordCount = parseInt(bestScore.textContent);
     let scoreCount  = parseInt(score.textContent);

     // Если текущий счет превысил максимальный результат
     // Запишем его в лучший результат и локальное хранилище
     
     if (scoreCount > recordCount) {      
      bestScore.textContent = scoreCount;
      let valuev = bestScore.textContent;
      window.localStorage.setItem(bestScore, valuev);
     }
   } 

 // Главный цикл игры
 function loop() {
  
   // начинаем анимацию
   rAF = requestAnimationFrame(loop);
   // очищаем холст
   context.clearRect(0,0,canvas.width,canvas.height);

   // рисуем игровое поле с учётом заполненных фигур
   for (let row = 0; row < 20; row++) {
     for (let col = 0; col < 10; col++) {
       if (playfield[row][col]) {
         const name = playfield[row][col];
         context.fillStyle = colors[name];

         // рисуем всё на один пиксель меньше, чтобы получился эффект «в клетку»
         context.fillRect(col * grid, row * grid, grid-1, grid-1);
       }
     }
   }

   // рисуем текущую фигуру
   if (tetromino) {
    if (scorePoints < 1000){
     // фигура сдвигается вниз каждые 35 кадров
     if (++count > 35) {
       tetromino.row++;
       count = 0;

       // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
       if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
         tetromino.row--;
         placeTetromino();
       }
     }
    } else if (scorePoints >= 1000 && scorePoints < 2500) {
      if (++count > 30) {
        tetromino.row++;
        count = 0;
 
        // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
        if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
          tetromino.row--;
          placeTetromino();
        }
      }
    } else if ( scorePoints >= 2500) {
      if (++count > 20) {
        tetromino.row++;
        count = 0;
 
        // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
        if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
          tetromino.row--;
          placeTetromino();
        }
      }
    } else {
      if (++count > 15) {
        tetromino.row++;
        count = 0;
 
        // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
        if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
          tetromino.row--;
          placeTetromino();
        }
      }
    }

     // не забываем про цвет текущей фигуры
     context.fillStyle = colors[tetromino.name];

     // отрисовываем её
     for (let row = 0; row < tetromino.matrix.length; row++) {
       for (let col = 0; col < tetromino.matrix[row].length; col++) {
         if (tetromino.matrix[row][col]) {

           // и снова рисуем на один пиксель меньше
           context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1);
         }
       }
     }
   }
 }

 // следим за нажатиями на клавиши
 document.addEventListener('keydown', function(e) {
   // если игра закончилась — сразу выходим
   if (gameOver) return;

   // стрелки влево и вправо
   if (e.which === 37 || e.which === 39) {
     const col = e.which === 37
       // если влево, то уменьшаем индекс в столбце, если вправо — увеличиваем
       ? tetromino.col - 1
       : tetromino.col + 1;

     // если так ходить можно, то запоминаем текущее положение 
     if (isValidMove(tetromino.matrix, tetromino.row, col)) {
       tetromino.col = col;
     }
   }

   // стрелка вверх — поворот
   if (e.which === 38) {
     // поворачиваем фигуру на 90 градусов
     const matrix = rotate(tetromino.matrix);
     // если так ходить можно — запоминаем
     if (isValidMove(matrix, tetromino.row, tetromino.col)) {
       tetromino.matrix = matrix;
     }
   }

   // стрелка вниз — ускорить падение
   if(e.which === 40) {
     // смещаем фигуру на строку вниз
     const row = tetromino.row + 1;
     // если опускаться больше некуда — запоминаем новое положение
     if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
       tetromino.row = row - 1;
       // ставим на место и смотрим на заполненные ряды
       placeTetromino();
       return;
     }
     // запоминаем строку, куда стала фигура
     tetromino.row = row;
   }
 });

 // старт игры
 rAF = requestAnimationFrame(loop);

 // Обработчик события по клику на кнопку рестарта
 restartBtn.addEventListener('click', restart);
  // Функция, отрабатывающая после клика, которая перехагружает страницу 
 function restart() {  
  window.location.reload();  
};


