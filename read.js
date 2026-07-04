let sentences = [];
let currentIndex = 0;
let bookId = "";
let currentFontSize = 36; // Cỡ chữ khổng lồ mặc định ban đầu

// Cấu hình tên Cơ sở dữ liệu đồng bộ với file index.js
const DB_NAME = "PixelZenReaderDB";
const STORE_NAME = "LibraryStore";

// Hàm kết nối nhanh tới IndexedDB của thiết bị
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// 1. KHỞI ĐỘNG TRANG ĐỌC (Bản Web thuần)
// Thay vì chờ PyWebView, trang web sẽ tự chạy ngay khi tải xong giao diện
document.addEventListener('DOMContentLoaded', async function() {
    // Lấy ID cuốn sách đang đọc dở được truyền từ index.html qua localStorage
    bookId = localStorage.getItem('active_book_id');
    
    if (!bookId) {
        alert("Không tìm thấy thông tin sách!");
        goBackToLibrary();
        return;
    }

    try {
        // Kết nối IndexedDB và lấy dữ liệu cuốn sách này ra RAM để đọc
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(bookId);

        getRequest.onsuccess = function() {
            const bookData = getRequest.result;

            if (!bookData) {
                alert("Cuốn sách này không tồn tại trong thiết bị của bạn!");
                goBackToLibrary();
                return;
            }

            // Đổ dữ liệu vào các biến toàn cục để chạy app
            sentences = bookData.sentences || [];
            currentIndex = bookData.current_index || 0;

            // Hiển thị tiêu đề sách lên thanh trạng thái
            document.getElementById("book-title-indicator").innerText = `📖 ${bookData.title}`;
            
            // Vẽ câu đầu tiên lên màn hình
            renderSentence();
        };
    } catch (err) {
        alert("Lỗi khi mở sách từ bộ nhớ máy: " + err.message);
        goBackToLibrary();
    }
});

// 2. Hàm hiển thị câu chữ lên màn hình
function renderSentence() {
    const box = document.getElementById("sentence-box");
    const counter = document.getElementById("sentence-counter");

    if (!box || !counter) return;

    if (sentences.length === 0) {
        box.innerText = "Sách không có nội dung chữ.";
        return;
    }

    // Đảm bảo chỉ số không chạy ra ngoài mảng
    if (currentIndex >= sentences.length) currentIndex = sentences.length - 1;
    if (currentIndex < 0) currentIndex = 0;

    // Bơm câu hiện tại vào ô chữ nhật
    box.innerText = sentences[currentIndex];
    
    // Cập nhật số dòng đang đọc
    counter.innerText = `[ DÒNG: ${currentIndex + 1} / ${sentences.length} ]`;

    // TỰ ĐỘNG LƯU TIẾN ĐỘ VÀO THIẾT BỊ (Thay cho Python)
    saveReadingProgress();
}

// Hàm ghi nhớ dòng đang đọc dở trực tiếp vào IndexedDB của điện thoại
async function saveReadingProgress() {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        // Lấy dữ liệu cũ ra, sửa lại current_index rồi ghi đè vào
        const getRequest = store.get(bookId);
        getRequest.onsuccess = function() {
            const bookData = getRequest.result;
            if (bookData) {
                bookData.current_index = currentIndex;
                store.put(bookData); // Ghi đè tiến độ mới
            }
        };
    } catch (err) {
        console.error("Không thể lưu tiến độ đọc tự động:", err);
    }
}

// 3. Hàm chuyển sang câu tiếp theo
function nextSentence() {
    if (currentIndex < sentences.length - 1) {
        currentIndex++;
        renderSentence();
    } else {
        alert("Chúc mừng! Bạn đã đọc hết cuốn sách này!");
    }
}

// 4. Hàm quay lại câu phía trước
function prevSentence() {
    if (currentIndex > 0) {
        currentIndex--;
        renderSentence();
    }
}

// 5. Hàm quay lại màn hình tủ sách chính
function goBackToLibrary() {
    window.location.href = "index.html";
}

// ==========================================================================
// CÁC TÍNH NĂNG NÂNG CẤP (FONT CHỮ, ĐỔI SIZE, TOGGLE THEME SWITCH)
// ==========================================================================
function changeFont(fontName) {
    const box = document.getElementById("sentence-box");
    if(box) box.style.fontFamily = fontName;
}

function adjustFontSize(offset) {
    currentFontSize += offset;
    if (currentFontSize < 18) currentFontSize = 18;
    if (currentFontSize > 72) currentFontSize = 72;
    
    const box = document.getElementById("sentence-box");
    if(box) box.style.fontSize = `${currentFontSize}px`;
}

function toggleTheme() {
    const body = document.getElementById("zen-body");
    const toggleBtn = document.getElementById("theme-toggle-btn");
    
    if(!body) return;
    body.classList.toggle("dark-mode");
    
    if (body.classList.contains("dark-mode")) {
        if (toggleBtn) toggleBtn.innerText = "☀️ SÁNG";
    } else {
        if (toggleBtn) toggleBtn.innerText = "👁 ĐÊM";
    }
}

// BẮT SỰ KIỆN PHÍM TẮT TRÊN MÁY TÍNH
document.addEventListener('keydown', function(event) {
    if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
        event.preventDefault(); 
        nextSentence();
    } else if (event.key === "ArrowLeft") {
        prevSentence();
    }
});