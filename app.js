const BOARD_SIZE = 15;
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');

// Biến cờ để test offline: Luân phiên X và O
let currentTurn = 'X'; 

// Hàm khởi tạo bàn cờ
function createBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            // Lưu tọa độ vào thuộc tính data của thẻ div
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Bắt sự kiện click
            cell.addEventListener('click', handleCellClick);
            
            boardElement.appendChild(cell);
        }
    }
}

// Xử lý khi click vào 1 ô
function handleCellClick(event) {
    const cell = event.target;
    const row = cell.dataset.row;
    const col = cell.dataset.col;

    // Nếu ô đã có chữ thì không cho đánh đè
    if (cell.innerText !== "") return;

    // In quân cờ lên giao diện
    cell.innerText = currentTurn;
    cell.classList.add(currentTurn.toLowerCase()); // Thêm class 'x' hoặc 'o' để đổi màu

    console.log(`Bạn vừa click vào dòng ${row}, cột ${col}. Đánh quân ${currentTurn}`);

    // Đổi lượt (chỉ dùng để test giao diện offline)
    currentTurn = currentTurn === 'X' ? 'O' : 'X';
    statusElement.innerText = `Chế độ test: Lượt của ${currentTurn}`;
    
    // TODO sau này: Chỗ này sẽ gọi WebSocket để gửi tọa độ (row, col) lên Server
}

// Chạy hàm tạo bàn cờ khi tải trang
createBoard();