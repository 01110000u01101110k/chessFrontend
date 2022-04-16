const board = document.getElementById("board");
const start_button = document.getElementById("start_btn");

start_button.addEventListener("click", start);

let dragged;

/* events fired on the draggable target */
board.addEventListener("drag", function (event) {}, false);

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
    console.log(event.target);
    event.preventDefault();
  },
  false
);

board.addEventListener(
  "dragenter",
  (event) => {
    // highlight potential drop target when the draggable element enters it
    if (event.target.id == "cell") {
      event.target.style.background = "purple";
    }
  },
  false
);

board.addEventListener(
  "dragleave",
  (event) => {
    // reset background of potential drop target when the draggable element leaves it
    if (event.target.id == "cell") {
      event.target.style.background = "";
    }
  },
  false
);

board.addEventListener(
  "drop",
  (event) => {
    // prevent default action (open as link for some elements)
    event.preventDefault();
    // move dragged elem to the selected drop target
    if (event.target.id == "cell") {
      event.target.style.background = "";
      dragged.parentNode.removeChild(dragged);
      event.target.appendChild(dragged);
    }
  },
  false
);

const count_cells = 64;

const pawn = "♟";
const bishop = "♝";
const horse = "♞"
const rook = "♜";
const queen = "♛";
const king = "♚";

let figureschess_pieces = [
  rook,horse,bishop,queen,king,bishop,horse,rook,
  pawn,pawn,pawn,pawn,pawn,pawn,pawn,pawn,
  "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "",
  pawn,pawn,pawn,pawn,pawn,pawn,pawn,pawn,
  rook,horse,bishop,queen,king,bishop,horse,rook,
];

const create_board = () => {
  let switch_parity_y = true;

  let x = 0;
  let y = 0;

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

    div.id = "cell";

    if (y < 4) {
      piece.classList.add("white_piece");
      piece.id = `white_${figureschess_pieces[i] || "piece"}`;
    } else {
      piece.classList.add("black_piece");
      piece.id = `black_${figureschess_pieces[i] || "piece"}`;
    }

    piece.innerText = figureschess_pieces[i];
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
