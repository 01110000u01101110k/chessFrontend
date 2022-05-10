const board = document.getElementById("board");
const start_button = document.getElementById("start_btn");

const status = document.getElementById('status')
const connectButton = document.getElementById('connect')
const log = document.getElementById('log')
const form = document.getElementById('chatform')
const input = document.getElementById('text')

//start_button.addEventListener("click", start);

/* data */

const count_cells = 64;

const pawn = "♟";
const bishop = "♝";
const horse = "♞"
const rook = "♜";
const queen = "♛";
const king = "♚";

let figureschess_pieces = [
  [rook,horse,bishop,king,queen,bishop,horse,rook],
  [pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn],
  [rook,horse,bishop,king,queen,bishop,horse,rook],
];

let dragged;

let whos_step = "white";

let is_rotate_board = true;

/* connect to server */

const chess_step = "chess-step";

let socket = null;

const set_log = (msg, type = 'status') => {
  log.innerHTML += `<p class="msg msg--${type}">${msg}</p>`;
  log.scrollTop += 1000;
}

function connect() {
  disconnect();

  const { location } = window;

  const proto = location.protocol.startsWith('https') ? 'wss' : 'ws';
  const wsUri = `${proto}://${location.host}/ws`;

  set_log('Connecting...');
  socket = new WebSocket(wsUri);

  socket.onopen = () => {
    set_log('Connected');
    updateConnectionStatus();
  }

  socket.onmessage = (ev) => {
    if(ev.data.indexOf(chess_step) > -1){
      update_position(ev.data);
    }
    set_log('Received: ' + ev.data, 'message');
  }

  socket.onclose = () => {
    set_log('Disconnected');
    socket = null;
    updateConnectionStatus();
  }
}

function update_position(data_from_server) {
  const data = data_from_server.split(" ")[1].split('_');

  let piece_from;
  let piece_to;
  let is_attacked = data[4];

  board.childNodes.forEach((element, index) => {
    if(index > 0) {
      element.dataset.cell_position_x === data[0] &&
      element.dataset.cell_position_y === data[1] ?
      piece_from = element :
      element.dataset.cell_position_x === data[2] &&
      element.dataset.cell_position_y === data[3] ?
      piece_to = element
      : null
    }
  });

  if(is_attacked === "true"){
    is_attacked = true;
  } else {
    is_attacked = false;
  }

  dragged_target(piece_from, piece_to, is_attacked, true);
}

function disconnect() {
  if (socket) {
    set_log('Disconnecting...');
    socket.close();
    socket = null;

    updateConnectionStatus();
  }
}

function updateConnectionStatus() {
  if (socket) {
    status.style.backgroundColor = 'transparent';
    status.style.color = 'green';
    status.textContent = `connected`;
    connectButton.innerHTML = 'Disconnect';
    input.focus();
  } else {
    status.style.backgroundColor = 'red';
    status.style.color = 'white';
    status.textContent = 'disconnected';
    connectButton.textContent = 'Connect';
  }
}

connectButton.addEventListener('click', () => {
  if (socket) {
    disconnect();
  } else {
    connect();
  }

  updateConnectionStatus();
})

form.addEventListener('submit', (ev) => {
  ev.preventDefault();

  const text = input.value;

  set_log('Sending: ' + text);
  socket.send(text);

  input.value = '';
  input.focus();
})

updateConnectionStatus();


/* game rules */

function change_whos_step() {
  if(whos_step === "white") {
    whos_step = "black"
  } else {
    whos_step = "white"
  }
}

function rotate_board() {
  if(is_rotate_board){
    board.style.webkitTransform = 'rotate(180deg)';

    board.childNodes.forEach((element, index) => {
      index > 0 ?
      element.style.webkitTransform = 'rotate(180deg)' :
      null
    })
  } else {
    board.style.webkitTransform = 'rotate(0deg)';

    board.childNodes.forEach((element, index) => {
      index > 0 ?
      element.style.webkitTransform = 'rotate(0deg)' :
      null
    })
  }

  is_rotate_board = !is_rotate_board;
}

const is_right_step = (dragged, target) => {
  if(dragged.dataset.color === "white" && target.dataset.color === "white"
  || dragged.dataset.color === "black" && target.dataset.color === "black") {
    return false;
  } // проверяю не является ли ход попыткой побить свою фигуру.

  const is_right_straight_steps = () => {
    if(Math.abs(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === 0 && Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) !== 0) {
      for(let i = 1; i <= Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y); i++){
        let result;

        if(+dragged.parentNode.dataset.cell_position_y < +target.dataset.cell_position_y){
          board.childNodes.forEach((element, index) => {
            if(index > 0) {
              element.dataset.cell_position_x === dragged.parentNode.dataset.cell_position_x &&
              element.dataset.cell_position_y === `${+dragged.parentNode.dataset.cell_position_y + i}` ?
              result = element :
              null
            }
          });
        } else {
          board.childNodes.forEach((element, index) => {
            if(index > 0) {
              element.dataset.cell_position_x === dragged.parentNode.dataset.cell_position_x &&
              element.dataset.cell_position_y === `${+dragged.parentNode.dataset.cell_position_y - i}` ?
              result = element :
              null
            }
          });
        }

        if(result.childNodes.length > 0) {
          return false;
        }
      }
      return true;
    } else if(Math.abs(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) !== 0 && Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === 0) {
      for(let i = 1; i <= Math.abs(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x); i++){
        let result;

        if(+dragged.parentNode.dataset.cell_position_x < +target.dataset.cell_position_x){
          board.childNodes.forEach((element, index) => {
            if(index > 0) {
              element.dataset.cell_position_y === dragged.parentNode.dataset.cell_position_y &&
              element.dataset.cell_position_x === `${+dragged.parentNode.dataset.cell_position_x + i}` ?
              result = element :
              null
            }
          });
        } else {
          board.childNodes.forEach((element, index) => {
            if(index > 0) {
              element.dataset.cell_position_y === dragged.parentNode.dataset.cell_position_y &&
              element.dataset.cell_position_x === `${+dragged.parentNode.dataset.cell_position_x - i}` ?
              result = element :
              null
            }
          });
        }

        if(result.childNodes.length > 0) {
          return false;
        }
      }
      return true;
    }
  }

  const check_obliquely_steps = () => {
    if(Math.abs(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y)) {
      for(let i = 1; i <= Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y); i++){
        let result;
        if(Math.sign(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === -1 && Math.sign(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === -1){
          board.childNodes.forEach((element, index) => {
            if(index > 0) {
              element.dataset.cell_position_x === `${+dragged.parentNode.dataset.cell_position_x - 1}` &&
              element.dataset.cell_position_y === `${+dragged.parentNode.dataset.cell_position_y - 1}` ?
              result = element :
              null
            }
          });
        } else if(Math.sign(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === 1 && Math.sign(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === 1) {
          board.childNodes.forEach((element, index) => {
            if(index > 0) {
              element.dataset.cell_position_x === `${+dragged.parentNode.dataset.cell_position_x + 1}` &&
              element.dataset.cell_position_y === `${+dragged.parentNode.dataset.cell_position_y + 1}` ?
              result = element :
              null
            }
          });
        } else if(Math.sign(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === 1 && Math.sign(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === -1){
          board.childNodes.forEach((element, index) => {
            if(index > 0) {
              element.dataset.cell_position_x === `${+dragged.parentNode.dataset.cell_position_x + 1}` &&
              element.dataset.cell_position_y === `${+dragged.parentNode.dataset.cell_position_y - 1}` ?
              result = element :
              null
            }
          });
        } else if(Math.sign(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === -1 && Math.sign(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === 1){
          board.childNodes.forEach((element, index) => {
            if(index > 0) {
              element.dataset.cell_position_x === `${+dragged.parentNode.dataset.cell_position_x - 1}` &&
              element.dataset.cell_position_y === `${+dragged.parentNode.dataset.cell_position_y + 1}` ?
              result = element :
              null
            }
          });
        }

        if(result.childNodes.length > 0) {
          return false;
        }
      }
      return true;
    }
  }

  if(dragged.dataset.piece === pawn){
    if(is_right_straight_steps()){
      if(dragged.dataset.color === "black" &&
        dragged.parentNode.dataset.cell_position_x === target.dataset.cell_position_x &&
        (target.dataset.cell_position_y === "6" ||
        target.dataset.cell_position_y === "5") &&
        dragged.parentNode.dataset.cell_position_y > target.dataset.cell_position_y) {
        return true;
      } else if(dragged.dataset.color === "white" &&
        dragged.parentNode.dataset.cell_position_x === target.dataset.cell_position_x &&
        (target.dataset.cell_position_y === "3" ||
        target.dataset.cell_position_y === "4") &&
        dragged.parentNode.dataset.cell_position_y < target.dataset.cell_position_y) {
        return true;
      } else if(dragged.dataset.color === "black" &&
      dragged.parentNode.dataset.cell_position_x === target.dataset.cell_position_x &&
      +dragged.parentNode.dataset.cell_position_y - 1 == target.dataset.cell_position_y) {
        return true;
      } else if(dragged.dataset.color === "white" &&
      dragged.parentNode.dataset.cell_position_x === target.dataset.cell_position_x &&
      +dragged.parentNode.dataset.cell_position_y + 1 == target.dataset.cell_position_y){
        return true;
      }
    }
  } else if(dragged.dataset.piece === bishop) {
    if(check_obliquely_steps()) {
      return true;
    }
  } else if(dragged.dataset.piece === horse) {
    if(
      (Math.abs(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === 1 &&
      Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === 2) ||
      (Math.abs(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === 2 &&
      Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === 1)
    ) {
      return true;
    }
  } else if(dragged.dataset.piece === rook) {
    if(is_right_straight_steps()){
      return true;
    }
  } else if(dragged.dataset.piece === queen) {
    if(check_obliquely_steps() ||
      is_right_straight_steps()
    ) {
      return true;
    }
  } else if(dragged.dataset.piece === king) {
    if(
      (Math.abs(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === 1 &&
      Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === 1) ||
      (Math.abs(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === 1 &&
      Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === 0) ||
      (Math.abs(+target.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x) === 0 &&
      Math.abs(+target.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y) === 1)
    ) {
      return true;
    }
  }

  return false;
}

const is_attacked = (dragged, target) => {
  if(dragged.dataset.color === "white" && target.dataset.color === "black" || dragged.dataset.color === "black" && target.dataset.color === "white"){
    if(dragged.dataset.color === "black" && dragged.dataset.piece === pawn) {
      if(+target.parentNode.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x === -1 && +target.parentNode.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y === -1 ||
        +target.parentNode.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x === 1 && +target.parentNode.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y === -1
        ){
          return true;
        }
    } else if(dragged.dataset.color === "white" && dragged.dataset.piece === pawn) {
      if(+target.parentNode.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x === -1 && +target.parentNode.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y === 1 ||
        +target.parentNode.dataset.cell_position_x - +dragged.parentNode.dataset.cell_position_x === 1 && +target.parentNode.dataset.cell_position_y - +dragged.parentNode.dataset.cell_position_y === 1
        ){
          return true;
        }
    } else {
      return true;
    }
  }
}

/* events fired on the draggable target */
board.addEventListener("drag", function (event) {
  event.target.style.opacity = 0;
}, false);

board.addEventListener(
  "dragstart",
  (event) => {
    dragged = event.target;

    event.target.style.opacity = 1;
  },
  false
);

board.addEventListener(
  "dragend",
  (event) => {
    // reset the transparency
    event.target.style.opacity = "";
  },
  false
);

/* events fired on the drop targets */
board.addEventListener(
  "dragover",
  (event) => {
    // prevent default to allow drop
    event.preventDefault();
  },
  false
);

board.addEventListener(
  "dragenter",
  (event) => {
    // highlight potential drop target when the draggable element enters it
    /*if (event.target.id == "cell") {
      event.target.style.background = "rgb(109, 64, 155)";
    }*/
  },
  false
);

board.addEventListener(
  "dragleave",
  (event) => {
    // reset background of potential drop target when the draggable element leaves it
    /*if (event.target.id == "cell") {
      event.target.style.background = "";
    }*/
  },
  false
);

function dragged_target(dragged, target, attacked, is_from_server) {
  target.style.background = "";

  if(attacked){
    if(!is_from_server) {
      if(socket){
        socket.send(`${chess_step} ${dragged.parentNode.dataset.cell_position_x}_${dragged.parentNode.dataset.cell_position_y}_${target.parentNode.dataset.cell_position_x}_${target.parentNode.dataset.cell_position_y}_${attacked}`)
      }

      dragged.parentNode.removeChild(dragged);
      target.parentNode.appendChild(dragged);
      target.remove();
    } else {
      let drag_child = dragged.children[0];
      let target_child = target.children[0];

      dragged.removeChild(drag_child);
      target_child.remove();
      target.appendChild(drag_child);
    }
  } else {
    if(!is_from_server) {
      if(socket){
        socket.send(`${chess_step} ${dragged.parentNode.dataset.cell_position_x}_${dragged.parentNode.dataset.cell_position_y}_${target.dataset.cell_position_x}_${target.dataset.cell_position_y}_${attacked}`);
      }

      dragged.parentNode.removeChild(dragged);
      target.appendChild(dragged);
    } else {
      let drag_child = dragged.children[0];

      dragged.removeChild(drag_child);
      target.appendChild(drag_child);
    }
  }

  change_whos_step();
}

board.addEventListener(
  "drop",
  (event) => {
    // prevent default action (open as link for some elements)
    event.preventDefault();
    // move dragged elem to the selected drop target

    if(dragged.dataset.color === "white" && whos_step === "white" ||
       dragged.dataset.color === "black" && whos_step === "black"
    ) {
      if(is_attacked(dragged, event.target)){
        dragged_target(dragged, event.target, true, false);
      } else if(is_right_step(dragged, event.target)) {
        dragged_target(dragged, event.target, false, false);
      }
    }

  },
  false
);

const create_board = () => {
  let switch_parity_y = true;

  let x = 0;
  let y = 1;

  for (let i = 0; i < count_cells; i++) {
    let div = document.createElement("div");
    let piece = document.createElement("div");

    if (x === 8) {
      switch_parity_y = !switch_parity_y;
      x = 0;
      y++;
    }

    if (x < 8) {
      x++;
    }

    if (switch_parity_y) {
      if (i % 2) {
        div.classList = "black_cell";
      } else {
        div.classList = "white_cell";
      }
    } else {
      if (i % 2) {
        div.classList = "white_cell";
      } else {
        div.classList = "black_cell";
      }
    }

    div.id = `cell_x=${x}_y=${y}`;
    div.dataset.cell_position_x = x;
    div.dataset.cell_position_y = y;

    let wrap_div = board.appendChild(div);

    if(figureschess_pieces[y - 1][x - 1]){
      if (y < 4) {
        piece.classList.add("white_piece");
        piece.id = `white_${figureschess_pieces[y - 1][x - 1]}`;

        piece.dataset.color = "white";
        piece.dataset.piece = figureschess_pieces[y - 1][x - 1];
      } else {
        piece.classList.add("black_piece");
        piece.id = `black_${figureschess_pieces[y - 1][x - 1]}`;

        piece.dataset.color = "black";
        piece.dataset.piece = figureschess_pieces[y - 1][x - 1];
      }
      piece.innerText = figureschess_pieces[y - 1][x - 1];
      piece.setAttribute("draggable", "true");

      wrap_div.appendChild(piece);
    }
  }
};

create_board();

const spawn_pieces = () => {
  //figureschess_pieces.forEach(element => board.innerHTML += element);
};

function start() {
  spawn_pieces();
}
