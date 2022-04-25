const board = document.getElementById("board");
const start_button = document.getElementById("start_btn");

//start_button.addEventListener("click", start);

const count_cells = 64;

const pawn = "♟";
const bishop = "♝";
const horse = "♞"
const rook = "♜";
const queen = "♛";
const king = "♚";

let figureschess_pieces = [
  [rook,horse,bishop,queen,king,bishop,horse,rook],
  [pawn,pawn,pawn,pawn,pawn,pawn,pawn,pawn],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", king, "", "", ""],
  ["", "", "", "", "", "", "", ""],
  [pawn,pawn,pawn,pawn,pawn,pawn,pawn,pawn],
  [rook,horse,bishop,queen,king,bishop,horse,rook],
];

let dragged;

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

board.addEventListener(
  "drop",
  (event) => {
    // prevent default action (open as link for some elements)
    event.preventDefault();
    // move dragged elem to the selected drop target

    const dragged_target = () => {
      event.target.style.background = "";
      dragged.parentNode.removeChild(dragged);
      event.target.appendChild(dragged);
    }

    const is_right_step = () => {
      console.log(dragged.id.slice(0,5), event.target.id.slice(0,5))
      if(dragged.id.slice(0,5) === "white" && event.target.id.slice(0,5) === "white"
      || dragged.id.slice(0,5) === "black" && event.target.id.slice(0,5) === "black") {
        return false;
      } // проверяю не является ли ход попыткой побить свою фигуру.

      if(dragged.id === `white_${pawn}` || dragged.id === `black_${pawn}`){
        if(dragged.id === `black_${pawn}` &&
          dragged.parentNode.id.slice(7, 8) === event.target.id.slice(7, 8) &&
          (event.target.id.indexOf('y=6') !== -1 ||
          event.target.id.indexOf('y=5') !== -1) &&
          dragged.parentNode.id.slice(11) > event.target.id.slice(11)) {
          return true;
        } else if(dragged.id === `white_${pawn}` &&
          dragged.parentNode.id.slice(7, 8) === event.target.id.slice(7, 8) &&
          (event.target.id.indexOf('y=3') !== -1 ||
          event.target.id.indexOf('y=4') !== -1) &&
          dragged.parentNode.id.slice(11) > event.target.id.slice(11)) {
          return true;
        } else if(dragged.id === `black_${pawn}` &&
        dragged.parentNode.id.slice(7, 8) === event.target.id.slice(7, 8) &&
        +dragged.parentNode.id.slice(11) - 1 == event.target.id.slice(11)) {
          return true;
        } else if(dragged.id === `white_${pawn}` &&
        dragged.parentNode.id.slice(7, 8) === event.target.id.slice(7, 8) &&
        +dragged.parentNode.id.slice(11) + 1 == event.target.id.slice(11)){
          return true;
        }
      } else if(dragged.id === `white_${bishop}` || dragged.id === `black_${bishop}`) {
        if(Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) === Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11))) {
          return true;
        }
      } else if(dragged.id === `white_${horse}` || dragged.id === `black_${horse}`) {
        if(
          (Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) === 1 &&
          Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) === 2) ||
          (Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) === 2 &&
          Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) === 1)
        ) {
          return true;
        }
      } else if(dragged.id === `white_${rook}` || dragged.id === `black_${rook}`) {
        if(Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) === 0 && Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) !== 0 ||
        Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) !== 0 && Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) === 0){
          return true;
        }
      } else if(dragged.id === `white_${queen}` || dragged.id === `black_${queen}`) {
        if(Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) === Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) ||
           Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) === 0 && Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) !== 0 ||
           Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) !== 0 && Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) === 0
        ) {
          return true;
        }
      } else if(dragged.id === `white_${king}` || dragged.id === `black_${king}`) {
        if(
          (Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) === 1 &&
          Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) === 1) ||
          (Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) === 1 &&
          Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) === 0) ||
          (Math.abs(+event.target.id.slice(7, 8) - +dragged.parentNode.id.slice(7, 8)) === 0 &&
          Math.abs(+event.target.id.slice(11) - +dragged.parentNode.id.slice(11)) === 1)
        ) {
          return true;
        }
      }

      return false;
    }

    const is_right_attack = () => {
      if(dragged.id === `white_${pawn}` || dragged.id === `black_${pawn}`){
        if(dragged.id === `black_${pawn}` && dragged.parentNode.id.slice(7, 8) && event.target.id.slice(11)) {
          return true;
        } else if(dragged.id === `white_${pawn}` && dragged.parentNode.id.slice(7, 8) && event.target.id.slice(11)) {
          return true;
        }
      } else if(dragged.id === `white_${bishop}` || dragged.id === `black_${bishop}`) {
        return true;
      } else if(dragged.id === `white_${horse}` || dragged.id === `black_${horse}`) {
        return true;
      } else if(dragged.id === `white_${rook}` || dragged.id === `black_${rook}`) {
        return true;
      } else if(dragged.id === `white_${queen}` || dragged.id === `black_${queen}`) {
        return true;
      } else if(dragged.id === `white_${king}` || dragged.id === `black_${king}`) {
        return true;
      }
    }

    if(is_right_step()) {
      if(dragged){
        if(is_right_attack()){
          dragged_target();
        }
      } else {
        dragged_target();
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

    if (y < 4) {
      piece.classList.add("white_piece");
      piece.id = `white_${figureschess_pieces[y - 1][x - 1] || "piece"}`;
    } else {
      piece.classList.add("black_piece");
      piece.id = `black_${figureschess_pieces[y - 1][x - 1] || "piece"}`;
    }

    piece.innerText = figureschess_pieces[y - 1][x - 1];
    piece.setAttribute("draggable", "true");

    let wrap_div = board.appendChild(div);
    wrap_div.appendChild(piece);
  }
};

create_board();

const spawn_pieces = () => {
  //figureschess_pieces.forEach(element => board.innerHTML += element);
};

function start() {
  spawn_pieces();
}
