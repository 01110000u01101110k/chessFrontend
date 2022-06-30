const board = document.getElementById("board");
//const start_button = document.getElementById("start_btn");

const status = document.getElementById('status');
const connect_form = document.getElementById("connect_form");
const connect_input = document.getElementById("connect_input");
const connectButton = document.getElementById('connect');
const log = document.getElementById('log');
const chat_form = document.getElementById('chat_form');
const input = document.getElementById('chat_input');
const retired_white_pieces = document.getElementById("retired_white_pieces");
const retired_black_pieces = document.getElementById("retired_black_pieces");
const restart_btn = document.getElementById("restart_btn");

//start_button.addEventListener("click", start);

/* data */

const count_cells = 64;

const pawn = "♟";
const bishop = "♝";
const horse = "♞"
const rook = "♜";
const queen = "♛";
const king = "♚";

let initial_position_chess_pieces = [
  [rook,horse,bishop,king,queen,bishop,horse,rook],
  [pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn],
  [rook,horse,bishop,king,queen,bishop,horse,rook],
];

let current_position_chess_pieces = [];

let dragged;

let selectedPieces;

let selectedTarget;

let player_color = "white";

let whos_step = "white";

let is_rotate_board = true;

let displaying_moves = [];

/* connect to server */

const chess_step = "chess-step";
const restart_game = "restart-game";

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

  socket.onmessage = (event) => {
    if(event.data.indexOf(chess_step) > -1){
      update_position(event.data);
    } else if(event.data.indexOf(restart_game) > -1) {
      create_board();
    }
    set_log('Received: ' + event.data, 'message');
  }

  socket.onclose = () => {
    set_log('Disconnected');
    socket = null;
    updateConnectionStatus();
  }
}

function update_position(data_from_server) {
  const data = data_from_server.split(" ")[1].split("_");

  let piece_from;
  let piece_to;

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

  check_rules(piece_from, piece_to, true);
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
    status.style.backgroundColor = 'rgb(113, 45, 234)';
    status.style.color = 'rgb(210, 210, 210)';
    status.textContent = `connected`;
    connectButton.innerHTML = 'Disconnect';
    connect_input.focus();
  } else {
    status.style.backgroundColor = 'rgb(255, 85, 57)';
    status.style.color = 'rgb(210, 210, 210)';
    status.textContent = 'disconnected';
    connectButton.textContent = 'Connect to room';
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

connect_form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = connect_input.value;

  set_log('Connecting: ' + text);
  socket.send(text);

  connect_input.value = '';
  connect_input.focus();
})

chat_form.addEventListener('submit', (event) => {
  event.preventDefault();

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

function find_kings() {
  let kings_nodes = [];
  let kings = [];

  board.childNodes.forEach((element, index) => {
    if(index > 0) {
      if(element.children.length > 0 && element.children[0].dataset.piece === king) {
        kings_nodes.push(element)
      }
    }
  });

  current_position_chess_pieces.forEach((element) => {
    if(element.piece && element.piece === king) {
      kings.push(element)
    }
  });

  return {kings, kings_nodes};
}

function is_threats_kings() {
  let kings_list = find_kings();

  let threat_to_enemy_king = false;
  let threat_to_our_king = false;

  kings_list.kings_nodes.forEach((king_node) => {
    king_node.style.border = "0px";
  })

  kings_list.kings.forEach((king) => {
    //current_position_chess_pieces
    current_position_chess_pieces.forEach((element) => {
      const current_step = is_right_current_step(element, king);
      if(element.piece && 
         element.color !== king.color &&
         current_step.is_right_step &&
         current_step.is_attack
      ) {

        kings_list.kings_nodes.forEach((king_node) => {
          if(king_node.children[0].dataset.color === king.color){
            king_node.style.border = "2mm ridge #ffb300";
          }
        })

        if(king.color !== whos_step){
          threat_to_enemy_king = true;
        } else {
          threat_to_our_king = true;
        }
      }
    })
  })

  /*if(!is_check){
    threat_to_enemy_king = null;
    threat_to_our_king = null;
  }*/

  return {threat_to_enemy_king: threat_to_enemy_king, threat_to_our_king: threat_to_our_king};
}

function is_checkmate() {
  let is_checkmate = true;

  current_position_chess_pieces.forEach((dragged) => {
    current_position_chess_pieces.forEach((target) => {
      if(dragged.piece &&
         dragged.color !== whos_step
      ){
        const step_info = is_right_current_step(dragged, target, false);

        if(step_info.is_right_step){
          const backup_current_position_chess_pieces = current_position_chess_pieces.map(element => ({...element}));

          change_piece_position(dragged, target);

          let threats_kings = is_threats_kings();

          if(!threats_kings.threat_to_enemy_king){
            is_checkmate = false;
          }

          current_position_chess_pieces = backup_current_position_chess_pieces;
        }
      }
    })
  })

  return is_checkmate;
}

const is_right_current_step = (dragged, target) => {
  let is_attack = false;

  /*const align_nesting_elements = () => {
    if(!dragged.cell_position_x){
      dragged = dragged.parentNode;
    }

    if(!target.cell_position_x){
      target = target.parentNode;
    }
  }*/

  /*align_nesting_elements();*/

  if(dragged) {

    const check_is_attack = () => {
      if(dragged.piece && target.piece) {
        if(dragged.color !== target.color) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    is_attack = check_is_attack();

    if(dragged.color === target.color) {
      return {is_attack, is_right_step: false};
    } // проверяю не является ли ход попыткой побить свою фигуру.

    const is_right_straight_steps = () => {
      if(Math.abs(+target.cell_position_x - +dragged.cell_position_x) === 0 && Math.abs(+target.cell_position_y - +dragged.cell_position_y) !== 0) {
        for(let i = 1; i < Math.abs(+target.cell_position_y - +dragged.cell_position_y); i++){
          let result;

          if(+dragged.cell_position_y < +target.cell_position_y){
            current_position_chess_pieces.forEach((element) => {
              element.cell_position_x === dragged.cell_position_x &&
              element.cell_position_y === `${+dragged.cell_position_y + i}` &&
              element.piece ?
              result = element :
              null
            });
          } else {
            current_position_chess_pieces.forEach((element) => {
              element.cell_position_x === dragged.cell_position_x &&
              element.cell_position_y === `${+dragged.cell_position_y - i}` &&
              element.piece ?
              result = element :
              null
            });
          }

          if(result) {
            return false;
          }
        }
        return true;
      } else if(Math.abs(+target.cell_position_x - +dragged.cell_position_x) !== 0 && Math.abs(+target.cell_position_y - +dragged.cell_position_y) === 0) {
        for(let i = 1; i < Math.abs(+target.cell_position_x - +dragged.cell_position_x); i++){
          let result;

          if(+dragged.cell_position_x < +target.cell_position_x){
            current_position_chess_pieces.forEach((element) => {
              element.cell_position_y === dragged.cell_position_y &&
              element.cell_position_x === `${+dragged.cell_position_x + i}` &&
              element.piece ?
              result = element :
              null
            });
          } else {
            current_position_chess_pieces.forEach((element) => {
              element.cell_position_y === dragged.cell_position_y &&
              element.cell_position_x === `${+dragged.cell_position_x - i}` &&
              element.piece ?
              result = element :
              null
            });
          }

          if(result) {
            return false;
          }
        }
        return true;
      }
    }

    const check_obliquely_steps = () => {
      if(Math.abs(+target.cell_position_x - +dragged.cell_position_x) === Math.abs(+target.cell_position_y - +dragged.cell_position_y)) {
        for(let i = 1; i < Math.abs(+target.cell_position_y - +dragged.cell_position_y); i++){
          let result;
          if(Math.sign(+target.cell_position_x - +dragged.cell_position_x) === -1 && Math.sign(+target.cell_position_y - +dragged.cell_position_y) === -1){
            current_position_chess_pieces.forEach((element) => {
              element.cell_position_x === `${+dragged.cell_position_x - i}` &&
              element.cell_position_y === `${+dragged.cell_position_y - i}` &&
              element.piece ?
              result = element :
              null
            });
          } else if(Math.sign(+target.cell_position_x - +dragged.cell_position_x) === 1 && Math.sign(+target.cell_position_y - +dragged.cell_position_y) === 1) {
            current_position_chess_pieces.forEach((element) => {
              element.cell_position_x === `${+dragged.cell_position_x + i}` &&
              element.cell_position_y === `${+dragged.cell_position_y + i}` &&
              element.piece ?
              result = element :
              null
            });
          } else if(Math.sign(+target.cell_position_x - +dragged.cell_position_x) === 1 && Math.sign(+target.cell_position_y - +dragged.cell_position_y) === -1){
            current_position_chess_pieces.forEach((element) => {
              element.cell_position_x === `${+dragged.cell_position_x + i}` &&
              element.cell_position_y === `${+dragged.cell_position_y - i}` &&
              element.piece ?
              result = element :
              null
            });
          } else if(Math.sign(+target.cell_position_x - +dragged.cell_position_x) === -1 && Math.sign(+target.cell_position_y - +dragged.cell_position_y) === 1){
            current_position_chess_pieces.forEach((element) => {
              element.cell_position_x === `${+dragged.cell_position_x - i}` &&
              element.cell_position_y === `${+dragged.cell_position_y + i}` &&
              element.piece ?
              result = element :
              null
            });
          }

          if(result) {
            return false;
          }
        }
        return true;
      }
    }

    if(dragged.piece === pawn){
      if(is_attack){
        if(dragged.color === "black") {
          if(+target.cell_position_x - +dragged.cell_position_x === -1 && +target.cell_position_y - +dragged.cell_position_y === -1 ||
            +target.cell_position_x - +dragged.cell_position_x === 1 && +target.cell_position_y - +dragged.cell_position_y === -1
            ){
              return {is_attack, is_right_step: true};
            }
        } else {
          if(+target.cell_position_x - +dragged.cell_position_x === -1 && +target.cell_position_y - +dragged.cell_position_y === 1 ||
            +target.cell_position_x - +dragged.cell_position_x === 1 && +target.cell_position_y - +dragged.cell_position_y === 1
            ){
              return {is_attack, is_right_step: true};
            }
        }
      }else if(is_right_straight_steps()){
        if(dragged.color === "black" &&
          dragged.cell_position_x === target.cell_position_x &&
          (target.cell_position_y === "6" ||
          target.cell_position_y === "5") &&
          dragged.cell_position_y > target.cell_position_y) {
          return {is_attack, is_right_step: true};
        } else if(dragged.color === "white" &&
          dragged.cell_position_x === target.cell_position_x &&
          (target.cell_position_y === "3" ||
          target.cell_position_y === "4") &&
          dragged.cell_position_y < target.cell_position_y) {
          return {is_attack, is_right_step: true};
        } else if(dragged.color === "black" &&
        dragged.cell_position_x === target.cell_position_x &&
        +dragged.cell_position_y - 1 == target.cell_position_y) {
          return {is_attack, is_right_step: true};
        } else if(dragged.color === "white" &&
        dragged.cell_position_x === target.cell_position_x &&
        +dragged.cell_position_y + 1 == target.cell_position_y){
          return {is_attack, is_right_step: true};
        }
      }
    } else if(dragged.piece === bishop) {
      if(check_obliquely_steps()) {
        return {is_attack, is_right_step: true};
      }
    } else if(dragged.piece === horse) {
      if(
        (Math.abs(+target.cell_position_x - +dragged.cell_position_x) === 1 &&
        Math.abs(+target.cell_position_y - +dragged.cell_position_y) === 2) ||
        (Math.abs(+target.cell_position_x - +dragged.cell_position_x) === 2 &&
        Math.abs(+target.cell_position_y - +dragged.cell_position_y) === 1)
      ) {
        return {is_attack, is_right_step: true};
      }
    } else if(dragged.piece === rook) {
      if(is_right_straight_steps()){
        return {is_attack, is_right_step: true};
      }
    } else if(dragged.piece === queen) {
      if(check_obliquely_steps() ||
        is_right_straight_steps()
      ) {
        return {is_attack, is_right_step: true};
      }
    } else if(dragged.piece === king) {
      if(
        (Math.abs(+target.cell_position_x - +dragged.cell_position_x) === 1 &&
        Math.abs(+target.cell_position_y - +dragged.cell_position_y) === 1) ||
        (Math.abs(+target.cell_position_x - +dragged.cell_position_x) === 1 &&
        Math.abs(+target.cell_position_y - +dragged.cell_position_y) === 0) ||
        (Math.abs(+target.cell_position_x - +dragged.cell_position_x) === 0 &&
        Math.abs(+target.cell_position_y - +dragged.cell_position_y) === 1)
      ) {
        return {is_attack, is_right_step: true};
      }
    }

    return {is_attack, is_right_step: false};
  } else {
    return {is_attack, is_right_step: false};
  }
}

function displaying_possible_moves_clean() {
  if(displaying_moves.length > 0){
    displaying_moves.forEach((element) => {
      element.style.border = "0px";
    })
    displaying_moves = [];
  }
}

function displaying_possible_moves(selected) {
  displaying_possible_moves_clean()

  let selected_piece = find_piece(selected);

  current_position_chess_pieces.forEach((element) => {
    if(is_right_current_step(selected_piece, element).is_right_step){
      let find_element_on_board;

      board.childNodes.forEach((target, index) => {
        if(index > 0) {
          if(target.dataset.cell_position_x === element.cell_position_x && 
            target.dataset.cell_position_y === element.cell_position_y
          ){
            find_element_on_board = target;
          }
        }
      })

      displaying_moves.push(find_element_on_board)
    }
  })

  displaying_moves.forEach((element) => {
    element.style.border = "1.4mm ridge rgb(138, 96, 200)"
  })
}

board.addEventListener("click", (event) => {
  if(!selectedPieces && event.target.dataset.color === whos_step || 
     selectedPieces && selectedPieces.dataset.color === event.target.dataset.color
  ){
    selectedPieces = event.target;
  } else if(selectedPieces) {
    selectedTarget = event.target
  }

  if(selectedPieces && !selectedTarget){
    displaying_possible_moves(event.target);
  } else if (selectedPieces && selectedTarget) {
    check_rules(selectedPieces, selectedTarget, false);

    selectedPieces = null;
    selectedTarget = null;
  }
})

/* events fired on the draggable target */
board.addEventListener("drag", function (event) {
  event.target.style.opacity = 0;
}, false);

board.addEventListener("dragstart", (event) => {
  dragged = event.target;

  if(dragged.dataset.color === whos_step) {
    displaying_possible_moves(dragged);
  }  

  event.target.style.opacity = 1;
}, false);

board.addEventListener("dragend", (event) => {
  // reset the transparency
  event.target.style.opacity = "";
}, false);

/* events fired on the drop targets */
board.addEventListener("dragover", (event) => {
  // prevent default to allow drop
  event.preventDefault();
}, false);

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

function create_popup(text) {
  const popup = document.createElement("div");
  const popup_header = document.createElement("div");
  const popup_content = document.createElement("div");
  const close_btn = document.createElement("div");

  popup.classList.add("popup");
  popup.id = "popup"

  popup_header.classList.add("popup_header");

  close_btn.classList.add("close_btn");
  close_btn.id = "close_btn";
  close_btn.textContent = "✕";

  popup_content.textContent = text;

  popup.appendChild(popup_header);
  popup_header.appendChild(close_btn);
  popup.appendChild(popup_content);
  board.appendChild(popup);

  close_btn.addEventListener("click", close_popup)
}

function close_popup(){
  const popup = document.getElementById("popup");

  const close_btn = document.getElementById("close_btn");
  close_btn.removeEventListener("click", close_popup);
  
  popup.remove();
}

function dragged_target(dragged, target, attacked, is_from_server) {
  target.style.background = "";

  if(!dragged.dataset.cell_position_x){
    dragged = dragged.parentNode;
  }

  if(!target.dataset.cell_position_x){
    target = target.parentNode;
  }

  let drag_child = dragged.children[0];
  let target_child = target.children[0];

  if(attacked){
    if(socket && !is_from_server){
      socket.send(`${chess_step} ${dragged.dataset.cell_position_x}_${dragged.dataset.cell_position_y}_${target.dataset.cell_position_x}_${target.dataset.cell_position_y}`)
    }

    if(target_child.dataset.color === "white") {
      target_child.style.width = "40px";
      retired_white_pieces.appendChild(target_child);
    } else {
      target_child.style.width = "40px";
      retired_black_pieces.appendChild(target_child);
    }

    dragged.removeChild(drag_child);
    target.appendChild(drag_child);
  } else {
    if(socket && !is_from_server){
      socket.send(`${chess_step} ${dragged.dataset.cell_position_x}_${dragged.dataset.cell_position_y}_${target.dataset.cell_position_x}_${target.dataset.cell_position_y}`);
    }

    dragged.removeChild(drag_child);
    target.appendChild(drag_child);
  }

  displaying_possible_moves_clean();

  change_whos_step();
}

function find_piece(dragged_piece) {
  let result = null;

  if(!dragged_piece.dataset.cell_position_x){
    dragged_piece = dragged_piece.parentNode;
  }

  current_position_chess_pieces.forEach((piece) => {
    if(piece.cell_position_x === dragged_piece.dataset.cell_position_x && 
       piece.cell_position_y === dragged_piece.dataset.cell_position_y
    ) {
      result = piece;
    }
  })

  return result;
}

function change_piece_position(dragged, target) {
  current_position_chess_pieces.map((element) => {
    if(element.cell_position_x == (dragged.dataset ? dragged.dataset.cell_position_x : dragged.cell_position_x) && 
      element.cell_position_y == (dragged.dataset ? dragged.dataset.cell_position_y : dragged.cell_position_y)
    ){
      element.piece = null;
      element.color = null;
    } else if(element.cell_position_x == (target.dataset ? target.dataset.cell_position_x : target.cell_position_x) && 
      element.cell_position_y == (target.dataset ? target.dataset.cell_position_y : target.cell_position_y)
    ){
      element.piece = dragged.dataset ? dragged.children[0].textContent : dragged.piece;
      element.color = dragged.dataset ? dragged.children[0].dataset.color : dragged.color;
    }
  })
}

function check_rules(dragged, target, is_from_server) {
  if(dragged && target){
    if(!dragged.dataset.cell_position_x){
      dragged = dragged.parentNode;
    }

    if(!target.dataset.cell_position_x){
      target = target.parentNode;
    }

    const find_dragged_element = find_piece(dragged);
    const find_target_element = find_piece(target);

    if(find_dragged_element.color === whos_step){
      const step_info = is_right_current_step(find_dragged_element, find_target_element, is_from_server);
    
      if(step_info.is_right_step){

        const backup_current_position_chess_pieces = current_position_chess_pieces.map(element => ({...element}));

        change_piece_position(dragged, target);

        let threats_kings = is_threats_kings();

        if(threats_kings.threat_to_our_king){
          current_position_chess_pieces = backup_current_position_chess_pieces;
        } else if(threats_kings.threat_to_enemy_king){
          if(is_checkmate()){
            create_popup(`${whos_step} wins`);
          }
          dragged_target(dragged, target, step_info.is_attack, false);
        } else {
          dragged_target(dragged, target, step_info.is_attack, false);
        }
      }
    }
  }
}

board.addEventListener(
  "drop",
  (event) => {
    // prevent default action (open as link for some elements)
    event.preventDefault();
    // move dragged elem to the selected drop target
    check_rules(dragged.parentNode, event.target, false)
    
    /*if(dragged.dataset.color === whos_step) {
      const step_info = is_right_current_step(dragged.parentNode, event.target);

      if(step_info.is_right_step){
        dragged_target(dragged, event.target, step_info.is_attack, false);
      }
    }*/

  },
  false
);

restart_btn.addEventListener("click", () => {
  if(socket){
    socket.send(`${restart_game}`);
  }
  create_board();
})

function remove_board() {
  if(board.childNodes.length > 0){
    board.innerHTML = null;
    current_position_chess_pieces = [];
    dragged = null;
    selectedPieces = null;
    selectedTarget = null;
    displaying_moves = [];
    whos_step = "white";

    retired_white_pieces.innerHTML = null;
    retired_black_pieces.innerHTML = null;
  }
}

const create_board = () => {
  let switch_parity_y = true;

  let x = 0;
  let y = 1;

  let color_piece = "black";

  remove_board();

  const try_change_color_piece = () => {
    if (y < 5 && color_piece !== "white") {
      color_piece = "white";
    } else if(y >= 5 && color_piece !== "black") {
      color_piece = "black";
    }
  } 

  const set_current_position_chess_piece = (piece) => {
    current_position_chess_pieces.push({
      piece: piece,
      color: piece ? color_piece : null,
      cell_position_x: `${x}`,
      cell_position_y: `${y}`
    });
  }

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

    div.dataset.cell_position_x = x;
    div.dataset.cell_position_y = y;

    let wrap_div = board.appendChild(div);

    try_change_color_piece();
    set_current_position_chess_piece(initial_position_chess_pieces[y - 1][x - 1]);

    if(initial_position_chess_pieces[y - 1][x - 1]){
      piece.classList.add(`${color_piece}_piece`);

      piece.dataset.color = color_piece;
      piece.dataset.piece = initial_position_chess_pieces[y - 1][x - 1];

      piece.innerText = initial_position_chess_pieces[y - 1][x - 1];
      piece.setAttribute("draggable", "true");

      wrap_div.appendChild(piece);
    }
  }

  /*function set_player_color() {
    if(Math.random() > 0.5){
      player_color = "white";
    } else {
      player_color = "black";
    }
  }

  set_player_color();

  if(player_color === "black") {
    rotate_board();
  }*/
};

create_board();

const spawn_pieces = () => {
  //initial_position_chess_pieces.forEach(element => board.innerHTML += element);
};

function start() {
  spawn_pieces();
}
