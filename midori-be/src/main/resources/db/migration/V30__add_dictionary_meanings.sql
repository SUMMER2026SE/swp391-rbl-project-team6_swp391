-- ============================================================
-- V30__add_dictionary_meanings.sql
-- Add Vietnamese meanings to dictionary entries from V29
-- This fixes the dictionary popup not showing meanings
-- ============================================================

-- First, let's add meanings for the most common words

-- Basic greetings
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'xin chào, khi không gặp buổi sáng', 1 FROM dictionary_entries WHERE surface = 'こんにちは';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'chào buổi sáng', 1 FROM dictionary_entries WHERE surface = 'おはよう';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'xin chào buổi tối', 1 FROM dictionary_entries WHERE surface = 'こんばんは';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tạm biệt', 1 FROM dictionary_entries WHERE surface = 'さようなら';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'cảm ơn', 1 FROM dictionary_entries WHERE surface = 'ありがとう';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'xin lỗi, xin lỗi đã làm phiền', 1 FROM dictionary_entries WHERE surface = 'すみません';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'xin lỗi (lịch sự hơn すみません)', 1 FROM dictionary_entries WHERE surface = 'ごめんなさい';

-- Pronouns
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tôi, em (cách nói lịch sự)', 1 FROM dictionary_entries WHERE surface = 'わたし';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'anh/em (gọi người cùng tuổi hoặc nhỏ hơn), cậu', 1 FROM dictionary_entries WHERE surface = 'きみ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'người đó', 1 FROM dictionary_entries WHERE surface = 'あの人';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'người này, người ấy', 1 FROM dictionary_entries WHERE surface = 'この人';

-- Basic verbs
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'làm, thực hiện', 1 FROM dictionary_entries WHERE surface = 'する';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'xem, nhìn, xem phim', 1 FROM dictionary_entries WHERE surface = '見る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nghe, hỏi', 1 FROM dictionary_entries WHERE surface = '聞く';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đi', 1 FROM dictionary_entries WHERE surface = '行く';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đến, đi (đến nơi người nói)', 1 FROM dictionary_entries WHERE surface = '来る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ăn', 1 FROM dictionary_entries WHERE surface = '食べる';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'uống', 1 FROM dictionary_entries WHERE surface = '飲む';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đọc', 1 FROM dictionary_entries WHERE surface = '読む';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'viết', 1 FROM dictionary_entries WHERE surface = '書く';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nói, nói chuyện', 1 FROM dictionary_entries WHERE surface = '話す';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'hiểu, biết, rõ ràng', 1 FROM dictionary_entries WHERE surface = '分かる';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nghĩ, suy nghĩ', 1 FROM dictionary_entries WHERE surface = '思う';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'làm ra, tạo ra, nấu (cơm)', 1 FROM dictionary_entries WHERE surface = '作る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ra, đi ra, rời đi', 1 FROM dictionary_entries WHERE surface = '出る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'vào, đi vào', 1 FROM dictionary_entries WHERE surface = '入る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ngủ, đi ngủ', 1 FROM dictionary_entries WHERE surface = '寝る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'thức dậy, tỉnh dậy', 1 FROM dictionary_entries WHERE surface = '起きる';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đợi, chờ đợi', 1 FROM dictionary_entries WHERE surface = '待つ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'mua', 1 FROM dictionary_entries WHERE surface = '買う';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'dùng, sử dụng', 1 FROM dictionary_entries WHERE surface = '使う';

-- Basic adjectives
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'lớn, to', 1 FROM dictionary_entries WHERE surface = '大きい';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nhỏ, bé', 1 FROM dictionary_entries WHERE surface = '小さい';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'mới', 1 FROM dictionary_entries WHERE surface = '新しい';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'cũ', 1 FROM dictionary_entries WHERE surface = '古い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tốt, hay, đẹp', 1 FROM dictionary_entries WHERE surface = '良い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'xấu, tệ', 1 FROM dictionary_entries WHERE surface = '悪い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'cao, đắt', 1 FROM dictionary_entries WHERE surface = '高い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'rẻ, (giá) hời', 1 FROM dictionary_entries WHERE surface = '安い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ngắn', 1 FROM dictionary_entries WHERE surface = '短い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'dài', 1 FROM dictionary_entries WHERE surface = '長い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ngon', 1 FROM dictionary_entries WHERE surface = '美味しい';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'lạnh (thời tiết)', 1 FROM dictionary_entries WHERE surface = '寒い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nóng (thời tiết)', 1 FROM dictionary_entries WHERE surface = '暑い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'khó, khó hiểu', 1 FROM dictionary_entries WHERE surface = '難しい';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'dễ, dễ hiểu', 1 FROM dictionary_entries WHERE surface = '易しい';

-- Particles
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'trợ từ chủ ngữ/chủ đề', 1 FROM dictionary_entries WHERE surface = 'は';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'trợ từ bổ ngữ (đánh dấu đối tượng)', 1 FROM dictionary_entries WHERE surface = 'を';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'trợ từ chủ ngữ', 1 FROM dictionary_entries WHERE surface = 'が';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'trợ từ chỉ nơi chốn/thời gian/mục đích', 1 FROM dictionary_entries WHERE surface = 'に';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'trợ từ chỉ nơi chốn/phương tiện', 1 FROM dictionary_entries WHERE surface = 'で';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'trợ từ và/với', 1 FROM dictionary_entries WHERE surface = 'と';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'trợ từ sở hữu/quan hệ', 1 FROM dictionary_entries WHERE surface = 'の';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'trợ từ chỉ hướng đến', 1 FROM dictionary_entries WHERE surface = 'へ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'từ, từ (chỗ) ~ đến ~', 1 FROM dictionary_entries WHERE surface = 'から';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đến tận, cho đến', 1 FROM dictionary_entries WHERE surface = 'まで';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'hơn, so với', 1 FROM dictionary_entries WHERE surface = 'より';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'cũng, (không những mà) còn', 1 FROM dictionary_entries WHERE surface = 'も';

-- Common nouns
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'người, người ta', 1 FROM dictionary_entries WHERE surface = '人';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'Nhật Bản', 1 FROM dictionary_entries WHERE surface = '日本';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tiếng Nhật', 1 FROM dictionary_entries WHERE surface = '日本語';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nước, nước uống', 1 FROM dictionary_entries WHERE surface = '水';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ô tô, xe hơi', 1 FROM dictionary_entries WHERE surface = '車';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'trường học', 1 FROM dictionary_entries WHERE surface = '学校';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'công ty', 1 FROM dictionary_entries WHERE surface = '会社';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'giáo viên, thầy/cô', 1 FROM dictionary_entries WHERE surface = '先生';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'bạn bè', 1 FROM dictionary_entries WHERE surface = '友達';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'gia đình', 1 FROM dictionary_entries WHERE surface = '家族';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'thời gian, giờ', 1 FROM dictionary_entries WHERE surface = '時間';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'hôm nay', 1 FROM dictionary_entries WHERE surface = '今日';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ngày mai', 1 FROM dictionary_entries WHERE surface = '明日';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'hôm qua', 1 FROM dictionary_entries WHERE surface = '昨日';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'buổi sáng', 1 FROM dictionary_entries WHERE surface = '朝';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ban ngày, trưa', 1 FROM dictionary_entries WHERE surface = '昼';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'buổi tối', 1 FROM dictionary_entries WHERE surface = '夜';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ngày', 1 FROM dictionary_entries WHERE surface = '日';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tháng', 1 FROM dictionary_entries WHERE surface = '月';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'năm', 1 FROM dictionary_entries WHERE surface = '年';

-- Numbers
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'một', 1 FROM dictionary_entries WHERE surface = '一';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'hai', 1 FROM dictionary_entries WHERE surface = '二';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ba', 1 FROM dictionary_entries WHERE surface = '三';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'bốn', 1 FROM dictionary_entries WHERE surface = '四';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'năm', 1 FROM dictionary_entries WHERE surface = '五';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'sáu', 1 FROM dictionary_entries WHERE surface = '六';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'bảy', 1 FROM dictionary_entries WHERE surface = '七';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tám', 1 FROM dictionary_entries WHERE surface = '八';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'chín', 1 FROM dictionary_entries WHERE surface = '九';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'mười', 1 FROM dictionary_entries WHERE surface = '十';

-- More verbs
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'yêu cầu, xin, nhờ', 1 FROM dictionary_entries WHERE surface = 'ください';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'biết, nhận ra, tìm thấy', 1 FROM dictionary_entries WHERE surface = '知る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'gặp, gặp gỡ', 1 FROM dictionary_entries WHERE surface = '会う';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'sống, ở (sống ở đâu đó)', 1 FROM dictionary_entries WHERE surface = '住む';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'về, trở về', 1 FROM dictionary_entries WHERE surface = '帰る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'mang, mang theo', 1 FROM dictionary_entries WHERE surface = '持つ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đặt, để, đặt (chỗ ngồi)', 1 FROM dictionary_entries WHERE surface = '置く';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đi ra, ra, đi ra (khỏi)', 1 FROM dictionary_entries WHERE surface = '出る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'lấy, nhận, lấy ra', 1 FROM dictionary_entries WHERE surface = '取る';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'cần, muốn (muốn làm gì đó)', 1 FROM dictionary_entries WHERE surface = 'いる';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'có, tồn tại (vật)', 1 FROM dictionary_entries WHERE surface = 'ある';

-- More nouns
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nhà', 1 FROM dictionary_entries WHERE surface = '家';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'bài học, giáo trình', 1 FROM dictionary_entries WHERE surface = '授業';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'sinh viên, học sinh', 1 FROM dictionary_entries WHERE surface = '学生';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'sách, vở', 1 FROM dictionary_entries WHERE surface = '本';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'từ, lời nói', 1 FROM dictionary_entries WHERE surface = '言葉';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'thức ăn, cơm', 1 FROM dictionary_entries WHERE surface = '食べ物';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đồ uống', 1 FROM dictionary_entries WHERE surface = '飲み物';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'thành phố', 1 FROM dictionary_entries WHERE surface = '市';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'cửa hàng, cửa hiệu', 1 FROM dictionary_entries WHERE surface = '店';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'bệnh viện', 1 FROM dictionary_entries WHERE surface = '病院';

-- More adjectives
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đẹp, xinh, tốt', 1 FROM dictionary_entries WHERE surface = 'いい';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nhanh, sớm', 1 FROM dictionary_entries WHERE surface = '早い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'chậm, muộn', 1 FROM dictionary_entries WHERE surface = '遅い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'khó chịu, bực mình', 1 FROM dictionary_entries WHERE surface = '嫌';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'vui, thích, thú vị', 1 FROM dictionary_entries WHERE surface = '面白い';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nghiêm trọng, đáng lo ngại', 1 FROM dictionary_entries WHERE surface = '大変';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'yêu thích, thích (thing/person)', 1 FROM dictionary_entries WHERE surface = '好き';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ghét, không thích', 1 FROM dictionary_entries WHERE surface = '嫌い';

-- Verbs (more)
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'học', 1 FROM dictionary_entries WHERE surface = '勉強する';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'làm việc, đi làm', 1 FROM dictionary_entries WHERE surface = '働く';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'nghiên cứu, học ở trường đại học', 1 FROM dictionary_entries WHERE surface = '研究する';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đi bộ, đi dạo', 1 FROM dictionary_entries WHERE surface = '歩く';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'chạy', 1 FROM dictionary_entries WHERE surface = '走る';

-- More expressions
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'được ạ, vâng (phủ định: không)', 1 FROM dictionary_entries WHERE surface = 'はい';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'không (phủ định)', 1 FROM dictionary_entries WHERE surface = 'いいえ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ai, người nào', 1 FROM dictionary_entries WHERE surface = '誰';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'gì, cái gì', 1 FROM dictionary_entries WHERE surface = '何';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'ở đâu', 1 FROM dictionary_entries WHERE surface = 'どこ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'bao giờ, khi nào', 1 FROM dictionary_entries WHERE surface = 'いつ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'như thế nào, ra sao', 1 FROM dictionary_entries WHERE surface = 'どう';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'bao nhiêu', 1 FROM dictionary_entries WHERE surface = 'いくつ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'bao nhiêu tiền', 1 FROM dictionary_entries WHERE surface = 'いくら';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'như thế, như vậy', 1 FROM dictionary_entries WHERE surface = 'その';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'cái này, điều này', 1 FROM dictionary_entries WHERE surface = 'これ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'cái đó, điều đó (gần người nghe)', 1 FROM dictionary_entries WHERE surface = 'それ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'cái kia, điều kia (xa cả 2 người)', 1 FROM dictionary_entries WHERE surface = 'あれ';

-- Time words
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tuần này', 1 FROM dictionary_entries WHERE surface = '今週';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tuần trước', 1 FROM dictionary_entries WHERE surface = '先週';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tuần sau', 1 FROM dictionary_entries WHERE surface = '来週';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'tháng này', 1 FROM dictionary_entries WHERE surface = '今月';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'năm nay', 1 FROM dictionary_entries WHERE surface = '今年';

-- Place words
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đây, nơi này', 1 FROM dictionary_entries WHERE surface = 'ここ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đó, nơi đó (gần người nghe)', 1 FROM dictionary_entries WHERE surface = 'そこ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'kia, nơi kia (xa cả 2 người)', 1 FROM dictionary_entries WHERE surface = 'あそこ';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'đâu, ở đâu', 1 FROM dictionary_entries WHERE surface = 'どこ';

-- Common verbs continued
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'gọi (điện thoại), rủ rê', 1 FROM dictionary_entries WHERE surface = '打电话' AND reading = '打电话';
INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order)
SELECT id, 'vi', 'học, học (từ vựng/ngữ pháp)', 1 FROM dictionary_entries WHERE surface = '学ぶ';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Added Vietnamese meanings to dictionary entries (V30)';
END $$;
