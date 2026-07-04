// ==========================================================================
// 🔥 CẤP CỨU MOBILE: HÀM ĐỒNG BỘ THUẦN TÚY ĐẶT ĐẦU FILE ĐỂ TRÁNH BỊ CHẶN CLICK
// ==========================================================================
function triggerUploadPDF() {
    const uploader = document.getElementById('web-pdf-uploader');
    if (uploader) {
        uploader.value = ""; 
        uploader.click();
    } else {
        alert("Lỗi: Không tìm thấy thẻ chọn file trên giao diện HTML!");
    }
}

// ==========================================================================
// 💡 PHẦN 1: CÁC CHIẾC HỘP GHI NHỚ & KẾT NỐI INDEXEDDB
// ==========================================================================
let currentBookId = "";      
let currentSentences = [];   
let currentIndex = 0;        

const DB_NAME = "PixelZenReaderDB";
const STORE_NAME = "LibraryStore";

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadLibrary(); 
});

// ==========================================================================
// 💡 PHẦN 2: QUẢN LÝ TỦ SÁCH QUA INDEXEDDB
// ==========================================================================
async function loadLibrary() {
    const booksGrid = document.getElementById('books-grid'); 
    const emptyState = document.getElementById('empty-state'); 
    if (!booksGrid) return;
    
    try {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = function() {
            const library = getAllRequest.result;
            
            if (!library || library.length === 0) {
                if (emptyState) emptyState.style.display = 'block'; 
                removeOldCards(booksGrid);          
                return;                             
            }
            
            if (emptyState) emptyState.style.display = 'none'; 
            removeOldCards(booksGrid);         
            
            library.forEach(book => {
                const card = document.createElement('div'); 
                card.className = 'book-card'; 
                
                card.innerHTML = `
                    <div class="book-title">${book.title}</div>
                    <div class="book-progress">Dòng hiện tại: ${book.current_index || 0}</div>
                    <div class="book-actions" style="display: flex; gap: 8px; margin-top: 10px;">
                        <button class="btn-pixel btn-read-now" onclick="startReading('${book.id}')" style="flex: 1;">ĐỌC TIẾP</button>
                        <button class="btn-pixel btn-delete" onclick="deleteBook('${book.id}', '${book.title.replace(/'/g, "\\'")}')" style="background-color: #ff4d4d; color: white;">XÓA</button>
                    </div>
                `;
                booksGrid.appendChild(card); 
            });
        };
    } catch (err) {
        console.error("Lỗi cơ sở dữ liệu trình duyệt: ", err);
    }
}

function removeOldCards(container) {
    if (!container) return;
    const cards = container.querySelectorAll('.book-card');
    cards.forEach(card => card.remove()); 
}

// ==========================================================================
// 💡 PHẦN 3: XỬ LÝ TRÍCH XUẤT PDF
// ==========================================================================
async function handlePDFUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const btn = document.getElementById('btn-upload');
    const originalText = btn ? btn.innerText : "MỞ FILE PDF";
    if (btn) {
        btn.innerText = "ĐANG TRÍCH XUẤT PDF..."; 
        btn.style.pointerEvents = "none";
    }

    const resetButton = (msg) => {
        alert(msg);
        if (btn) {
            btn.innerText = originalText;
            btn.style.pointerEvents = "auto";
        }
        input.value = "";
    };

    const pdfjs = window['pdfjs-dist/build/pdf'] || window['pdfjsLib'] || pdfjsLib;
    if (!pdfjs) {
        return resetButton("Lỗi: Không tìm thấy thư viện PDF.js. Vui lòng kiểm tra lại mạng!");
    }

    const fileReader = new FileReader();
    
    fileReader.onerror = function() {
        resetButton("Lỗi FileReader: Không thể đọc file từ thiết bị.");
    };

    fileReader.onload = async function() {
        try {
            const typedarray = new Uint8Array(this.result);
            const loadingTask = pdfjs.getDocument({
                data: typedarray,
                disableWorker: true,
                verbosity: 0
            });
            
            const pdf = await loadingTask.promise;
            let fullText = "";
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                if (textContent && textContent.items) {
                    const pageText = textContent.items.map(item => item.str).join(" ");
                    fullText += pageText + " ";
                }
            }
            
            fullText = fullText.replace(/\s+/g, ' ').trim();
            if (!fullText) {
                return resetButton("Cảnh báo: File PDF này không chứa text thuần (có thể là file scan dạng ảnh).");
            }
            
            let sentences = fullText.split(/(?<=[.!?])\s+/).filter(s => s.trim());
            if (sentences.length === 0) {
                return resetButton("Không thể tách thành câu từ file PDF này.");
            }
            
            const bookId = "pdf_" + Date.now();
            const newBook = {
                id: bookId,
                title: file.name.replace(".pdf", ""),
                sentences: sentences,
                current_index: 0
            };
            
            const db = await initDB();
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            store.add(newBook);
            
            transaction.oncomplete = function() {
                alert(`Thành công! Đã trích xuất ${sentences.length} câu vào thư viện.`);
                if (btn) {
                    btn.innerText = originalText;
                    btn.style.pointerEvents = "auto";
                }
                input.value = ""; 
                loadLibrary(); 
            };

            transaction.onerror = function(e) {
                resetButton("Lỗi khi ghi dữ liệu: " + e.target.error.message);
            };

        } catch (innerErr) {
            resetButton("Lỗi xử lý nội dung PDF: " + innerErr.message);
        }
    };
    
    fileReader.readAsArrayBuffer(file);
}

// ==========================================================================
// 💡 PHẦN 4: VÀO PHÒNG ĐỌC SÁCH & XÓA SÁCH
// ==========================================================================
function startReading(bookId) {
    localStorage.setItem('active_book_id', bookId);
    window.location.href = "read.html";
}

async function deleteBook(bookId, bookTitle) {
    const confirmDelete = confirm(`Bạn có chắc muốn xóa cuốn sách "${bookTitle}"?\nHành động này không thể hoàn tác!`);
    if (confirmDelete) {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(bookId);
        
        transaction.oncomplete = function() {
            alert("Đã xóa sách khỏi thiết bị!");
            loadLibrary();
        };
    }
}

function handleCreateYoutubeBook() { 
    const modal = document.getElementById('youtube-modal');
    if (modal) modal.style.display = 'flex'; 
}
function closeYoutubeModal() { 
    const modal = document.getElementById('youtube-modal');
    const input = document.getElementById('youtube-link-input');
    if (modal) modal.style.display = 'none'; 
    if (input) input.value = ""; 
}
function submitYoutubeRequest() { 
    alert("Tính năng cào phụ đề cần server, trên bản web tĩnh tạm thời đóng."); 
    closeYoutubeModal(); 
}
/**
 * Hàm xử lý chuyển hướng khi người dùng ấn nút "DỊCH VĂN BẢN DÀI"
 */
function handleTranslate() {
    // Chuyển hướng trình duyệt sang trang translate.html
    window.location.href = "translate.html";
}