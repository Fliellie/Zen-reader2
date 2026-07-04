document.addEventListener("DOMContentLoaded", function () {
    // 1. Khai báo các phần tử DOM
    const btnBack = document.getElementById("btnBack");
    const btnTranslate = document.getElementById("btnTranslate");
    const langSelect = document.getElementById("langSelect");
    const sourceText = document.getElementById("sourceText");
    const targetText = document.getElementById("targetText");
    const lblSource = document.getElementById("lblSource");
    const lblTarget = document.getElementById("lblTarget");
    const btnHighlightTranslate = document.getElementById("btnHighlightTranslate");

    // 2. Xử lý sự kiện ấn nút "Quay lại trang chủ"
    btnBack.addEventListener("click", function () {
        window.location.href = "index.html"; 
    });
    // XỬ LÝ SỰ KIỆN: Ấn nút "Dịch theo bôi đen" -> Chuyển sang translate1.html
    if (btnHighlightTranslate) {
        btnHighlightTranslate.addEventListener("click", function () {
            window.location.href = "translate1.html";
        });
    }

    // 3. Xử lý sự kiện thay đổi tùy chọn ngôn ngữ (Thay đổi nhãn bảng tương ứng)
    langSelect.addEventListener("change", function () {
        if (langSelect.value === "en-vi") {
            lblSource.textContent = "Văn bản gốc (Tiếng Anh):";
            lblTarget.textContent = "Bản dịch (Tiếng Việt):";
            sourceText.placeholder = "Nhập văn bản tiếng Anh...";
        } else {
            lblSource.textContent = "Văn bản gốc (Tiếng Việt):";
            lblTarget.textContent = "Bản dịch (Tiếng Anh):";
            sourceText.placeholder = "Nhập văn bản tiếng Việt...";
        }
        // Xóa nội dung cũ khi đổi ngôn ngữ để tránh nhầm lẫn
        sourceText.value = "";
        targetText.value = "";
    });

    // 4. Xử lý sự kiện ấn nút "Phiên dịch"
    btnTranslate.addEventListener("click", function () {
        const textToTranslate = sourceText.value.trim();

        // Kiểm tra nếu người dùng chưa nhập gì
        if (textToTranslate === "") {
            alert("Vui lòng nhập văn bản cần dịch!");
            return;
        }

        // Thông báo đang dịch
        targetText.value = "Đang dịch...";

        // Giả lập xử lý dịch thuật (Bạn có thể thay thế bằng API dịch thật như Google Translate hoặc xử lý riêng)
        // Thay vì dùng setTimeout giả lập, ta dùng API dịch thật:
const currentMode = langSelect.value;
let sourceLang, targetLang;

if (currentMode === "en-vi") {
    sourceLang = "en";
    targetLang = "vi";
} else {
    sourceLang = "vi";
    targetLang = "en";
}

// Gọi API MyMemory (Dịch miễn phí, không cần đăng ký tài khoản)
// Sử dụng cổng dịch "ké" của Google (Miễn phí, không cần key)
const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;

fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        // Cấu trúc dữ liệu trả về của Google dạng mảng lồng nhau
        if (data && data[0]) {
            let translatedText = "";
            data[0].forEach(item => {
                if (item[0]) translatedText += item[0];
            });
            targetText.value = translatedText;
        } else {
            targetText.value = "Lỗi: Không thể lấy dữ liệu dịch.";
        }
    })
    .catch(error => {
        console.error("Lỗi:", error);
        targetText.value = "Đã xảy ra lỗi kết nối!";
    });// Tạo hiệu ứng trễ 0.5s nhìn cho tự nhiên
    });
});
