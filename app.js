const BOARD_SIZE = 15;
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');

const ws = new WebSocket('ws://localhost:8080/game');

// Các biến lưu trạng thái do Server cấp phát
let myRole = ''; 
let currentTurn = 'X'; // Mặc định ván mới luôn là X đi trước

ws.onopen = function() {
    statusElement.innerText = "Đang chờ Server phân vai trò...";
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    // 1. Nhận vai trò lúc mới vào game
    if (data.type === 'init') {
        myRole = data.role;
        if (myRole === 'Khán giả') {
            statusElement.innerText = "Phòng đã đầy! Bạn đang xem với tư cách Khán giả.";
        } else {
            statusElement.innerText = `Bạn là quân ${myRole}. Lượt của ${currentTurn}`;
        }
    } 
    // 2. Nhận bản cập nhật nước đi từ Server
    else if (data.type === 'move') {
        const cellIndex = data.row * BOARD_SIZE + data.col;
        const cell = boardElement.children[cellIndex];
        
        // Vẽ quân cờ lên bàn
        cell.innerText = data.player;
        cell.classList.add(data.player.toLowerCase());
        
        // Cập nhật lượt đi tiếp theo do Server chỉ định
        currentTurn = data.nextTurn;
        
        if (myRole !== 'Khán giả') {
            if (myRole === currentTurn) {
                statusElement.innerText = `Tới lượt bạn đánh (${myRole})!`;
                statusElement.style.color = "blue";
            } else {
                statusElement.innerText = `Chờ đối thủ đánh (${currentTurn})...`;
                statusElement.style.color = "black";
            }
        }
    }
    else if(data.type=="win"){
        const cellIndex= data.row*BOARD_SIZE +data.col;
        const cell = boardElement.children[cellIndex];
        cell.innerText = data.player;
        cell.classList.add(data.player.toLowerCase());
        if(myRole==data.winner){
            statusElement.innerText = " CHÚC MỪNG! BẠN ĐÃ CHIẾN THẮNG! ";
            statusElement.style.color = "green";
        } else if(myRole!=='Khán giả'){
            statusElement.innerText = " BẠN ĐÃ THUA! ĐỐI THỦ QUÁ MẠNH! ";
            statusElement.style.color = "red";
        } else{
            statusElement.innerText = `TRẬN ĐẤU KẾT THÚC! QUÂN ${data.winner} ĐÃ THẮNG!`;
            statusElement.style.color = "purple";
        }
        myRole ="Khán giả";
        setTimeout(()=>{
            alert(`Trận đấu kết thúc! Người chơi ${data.winner} đã giành chiến thắng!`);
        },100);
    }
};

function createBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
    }
}

function handleCellClick(event) {
    // KHÓA CHIÊU: Nếu là Khán giả, hoặc KHÔNG PHẢI LƯỢT CỦA MÌNH -> Cấm click
    if (myRole === 'Khán giả' || myRole !== currentTurn) {
        console.log("Chưa tới lượt của bạn!");
        return; 
    }

    const cell = event.target;
    if (cell.innerText !== "") return;

    // Gửi yêu cầu đánh cờ lên Server kiểm duyệt
    const moveData = {
        type: 'move',
        row: parseInt(cell.dataset.row),
        col: parseInt(cell.dataset.col),
        player: myRole // Gửi danh tính của mình lên
    };

    ws.send(JSON.stringify(moveData));
}

createBoard();