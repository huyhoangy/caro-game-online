package com.huyhoang.caro_server.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());
    private final ObjectMapper objectMapper = new ObjectMapper();

    private WebSocketSession playerX = null;
    private WebSocketSession playerO = null;
    private String currentTurn = "X";
    
    private String[][] board = new String[15][15];
    private boolean isGameOver = false;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        String assignedRole = "";
        
        // SỬA LỖI 3: Đồng bộ hóa quá trình phân vai trò để tránh đụng độ
        synchronized (this) {
            if (playerX == null) {
                playerX = session;
                assignedRole = "X";
            } else if (playerO == null) {
                playerO = session;
                assignedRole = "O";
            } else {
                assignedRole = "Khán giả";
            }
        }

        ObjectNode initMessage = objectMapper.createObjectNode();
        initMessage.put("type", "init");
        initMessage.put("role", assignedRole);
        session.sendMessage(new TextMessage(initMessage.toString()));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (isGameOver) return; 

        JsonNode jsonNode = objectMapper.readTree(message.getPayload());
        
        if (jsonNode.has("type") && jsonNode.get("type").asText().equals("move")) {
            
            // SỬA LỖI 2: Kiểm tra dữ liệu đầu vào chặt chẽ
            if (!jsonNode.has("player") || !jsonNode.has("row") || !jsonNode.has("col")) {
                return; // Chặn nếu gói tin bị thiếu dữ liệu
            }

            String playerWhoClicked = jsonNode.get("player").asText();
            int row = jsonNode.get("row").asInt();
            int col = jsonNode.get("col").asInt();

            // Chặn nếu tọa độ nằm ngoài bàn cờ 15x15
            if (row < 0 || row >= 15 || col < 0 || col >= 15) return;

            if (!playerWhoClicked.equals(currentTurn) || board[row][col] != null) {
                return; 
            }

            board[row][col] = playerWhoClicked;

            if (checkWin(row, col, playerWhoClicked)) {
                isGameOver = true;
                ((ObjectNode) jsonNode).put("type", "win"); 
                ((ObjectNode) jsonNode).put("winner", playerWhoClicked);
            } else {
                currentTurn = currentTurn.equals("X") ? "O" : "X";
                ((ObjectNode) jsonNode).put("nextTurn", currentTurn);
            }

            TextMessage messageToBroadcast = new TextMessage(jsonNode.toString());
            
            // SỬA LỖI 1: Bọc synchronized khi lặp qua danh sách sessions
            synchronized (sessions) {
                for (WebSocketSession s : sessions) {
                    if (s.isOpen()) s.sendMessage(messageToBroadcast);
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        
        // Đồng bộ hóa khi dọn dẹp biến
        synchronized (this) {
            if (session.equals(playerX)) playerX = null;
            if (session.equals(playerO)) playerO = null;
            
            board = new String[15][15];
            isGameOver = false;
            currentTurn = "X";
        }
    }

    // ==========================================
    // THUẬT TOÁN TÌM 5 QUÂN LIÊN TIẾP (Giữ nguyên, thuật toán của bạn rất chuẩn)
    // ==========================================
    private boolean checkWin(int row, int col, String player) {
        return countConsecutive(row, col, 0, 1, player) + countConsecutive(row, col, 0, -1, player) >= 4 || 
               countConsecutive(row, col, 1, 0, player) + countConsecutive(row, col, -1, 0, player) >= 4 || 
               countConsecutive(row, col, 1, 1, player) + countConsecutive(row, col, -1, -1, player) >= 4 || 
               countConsecutive(row, col, 1, -1, player) + countConsecutive(row, col, -1, 1, player) >= 4;   
    }

    private int countConsecutive(int row, int col, int dRow, int dCol, String player) {
        int count = 0;
        int r = row + dRow;
        int c = col + dCol;
        
        while (r >= 0 && r < 15 && c >= 0 && c < 15 && player.equals(board[r][c])) {
            count++;
            r += dRow;
            c += dCol;
        }
        return count;
    }
}