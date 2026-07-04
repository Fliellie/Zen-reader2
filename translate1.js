document.addEventListener("DOMContentLoaded", function () {
    const btnBack = document.getElementById("btnBack");
    const btnTranslate = document.getElementById("btnTranslate");
    const btnAddWord = document.getElementById("btnAddWord");
    const langSelect = document.getElementById("langSelect");
    const translationResult = document.getElementById("translationResult");
    const mainContent = document.getElementById("mainContent");

    // 1. Sự kiện quay lại trang trước (translate.html)
    btnBack.addEventListener("click", function () {
        window.location.href = "translate.html";
    });

    // 2. Xử lý sự kiện "Dịch chữ bôi đen"
    btnTranslate.addEventListener("click", function () {
        // Lấy đoạn văn bản mà người dùng đang bôi đen
        let selectedText = "";
        
        if (window.getSelection) {
            selectedText = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            // Hỗ trợ trình duyệt cũ nếu có
            selectedText = document.selection.createRange().text;
        }

        // Nếu người dùng bôi đen trong thẻ textarea, window.getSelection() trên một số trình duyệt cần bắt theo cách này:
        if (!selectedText && document.activeElement === mainContent) {
            selectedText = mainContent.value.substring(mainContent.selectionStart, mainContent.selectionEnd);
        }

        selectedText = selectedText.trim();

        // Kiểm tra xem đã bôi đen chữ chưa
        if (selectedText === "") {
            translationResult.innerHTML = "<span style='color: red;'>Vui lòng bôi đen (chọn) một đoạn chữ trong bảng trước!</span>";
            return;
        }

        // Tiến hành dịch thật bằng API Google
        translationResult.textContent = "Đang dịch đoạn bôi đen...";

        const currentMode = langSelect.value;
        let sourceLang = currentMode === "en-vi" ? "en" : "vi";
        let targetLang = currentMode === "en-vi" ? "vi" : "en";

        const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(selectedText)}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data && data[0]) {
                    let translatedText = "";
                    data[0].forEach(item => {
                        if (item[0]) translatedText += item[0];
                    });
                    // Hiển thị kết quả lên thanh Header
                    translationResult.textContent = translatedText;
                } else {
                    translationResult.textContent = "Lỗi: Không thể phân tích bản dịch.";
                }
            })
            .catch(error => {
                console.error("Lỗi:", error);
                translationResult.textContent = "Lỗi kết nối mạng khi dịch!";
            });
    });

    // 3. Xử lý nút "Thêm vào sổ từ" (Tính năng phát triển sau)
    btnAddWord.addEventListener("click", function () {
        // Lấy từ vừa dịch ra để chuẩn bị lưu trữ sau này
        const textToSave = translationResult.textContent;
        
        if (textToSave.includes("Bôi đen văn bản") || textToSave.includes("Vui lòng bôi đen") || textToSave.includes("Đang dịch")) {
            alert("Chưa có từ vựng hợp lệ được dịch để lưu!");
            return;
        }

        // Hiện tại thông báo giả lập cho tính năng tương lai
        alert(`Đã kích hoạt tính năng! Hệ thống sẽ lưu từ này vào sổ từ trong phiên bản tiếp theo.\nNội dung lưu: ${textToSave}`);
    });
});