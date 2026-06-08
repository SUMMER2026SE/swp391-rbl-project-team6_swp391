-- ============================================================
-- Seed demo vocabulary data (N5)
-- DATA-01 / UI-18
-- Adds 10 published N5 lessons with 5 words each.
-- ============================================================

WITH teacher_seed AS (
    SELECT id
    FROM users
    WHERE role = 'TEACHER'
    ORDER BY created_at ASC
    LIMIT 1
),
inserted_lessons AS (
    INSERT INTO vocabulary_lessons (
        title,
        description,
        level,
        topic,
        estimated_minutes,
        word_count,
        is_published,
        created_by
    )
    VALUES
        ('Bài 1: Chào hỏi', 'Từ vựng N5 về chào hỏi hằng ngày.', 'N5', 'Greetings', 12, 5, TRUE, (SELECT id FROM teacher_seed)),
        ('Bài 2: Gia đình', 'Từ vựng N5 về các thành viên trong gia đình.', 'N5', 'Family', 12, 5, TRUE, (SELECT id FROM teacher_seed)),
        ('Bài 3: Số đếm', 'Từ vựng N5 về số đếm cơ bản.', 'N5', 'Numbers', 12, 5, TRUE, (SELECT id FROM teacher_seed)),
        ('Bài 4: Thời gian', 'Từ vựng N5 về thời gian và lịch trình.', 'N5', 'Time', 12, 5, TRUE, (SELECT id FROM teacher_seed)),
        ('Bài 5: Trường học', 'Từ vựng N5 dùng ở trường học.', 'N5', 'School', 12, 5, TRUE, (SELECT id FROM teacher_seed)),
        ('Bài 6: Đồ ăn', 'Từ vựng N5 về món ăn quen thuộc.', 'N5', 'Food', 12, 5, TRUE, (SELECT id FROM teacher_seed)),
        ('Bài 7: Màu sắc', 'Từ vựng N5 về màu sắc cơ bản.', 'N5', 'Colors', 12, 5, TRUE, (SELECT id FROM teacher_seed)),
        ('Bài 8: Địa điểm', 'Từ vựng N5 về các địa điểm quen thuộc.', 'N5', 'Places', 12, 5, TRUE, (SELECT id FROM teacher_seed)),
        ('Bài 9: Phương tiện', 'Từ vựng N5 về phương tiện di chuyển.', 'N5', 'Transportation', 12, 5, TRUE, (SELECT id FROM teacher_seed)),
        ('Bài 10: Tính từ', 'Từ vựng N5 về tính từ cơ bản.', 'N5', 'Adjectives', 12, 5, TRUE, (SELECT id FROM teacher_seed))
    RETURNING id, title
)
INSERT INTO vocabulary_words (
    lesson_id,
    word,
    furigana,
    romaji,
    meaning,
    example_japanese,
    example_meaning,
    display_order
)
SELECT l.id, w.word, w.furigana, w.romaji, w.meaning, w.example_japanese, w.example_meaning, w.display_order
FROM inserted_lessons l
JOIN (
    VALUES
        ('Bài 1: Chào hỏi', 'おはよう', 'おはよう', 'ohayou', 'chào buổi sáng', 'おはよう、ともだち。', 'Chào buổi sáng, bạn nhé.', 1),
        ('Bài 1: Chào hỏi', 'こんにちは', 'こんにちは', 'konnichiwa', 'xin chào', 'こんにちは、せんせい。', 'Xin chào, thầy/cô.', 2),
        ('Bài 1: Chào hỏi', 'こんばんは', 'こんばんは', 'konbanwa', 'chào buổi tối', 'こんばんは、おかあさん。', 'Chào buổi tối, mẹ.', 3),
        ('Bài 1: Chào hỏi', 'ありがとう', 'ありがとう', 'arigatou', 'cảm ơn', 'てつだってくれて、ありがとう。', 'Cảm ơn vì đã giúp tôi.', 4),
        ('Bài 1: Chào hỏi', 'さようなら', 'さようなら', 'sayounara', 'tạm biệt', 'さようなら、またあした。', 'Tạm biệt, hẹn mai gặp lại.', 5),

        ('Bài 2: Gia đình', 'かぞく', 'かぞく', 'kazoku', 'gia đình', 'わたしのかぞくはよにんです。', 'Gia đình tôi có bốn người.', 1),
        ('Bài 2: Gia đình', 'ちち', 'ちち', 'chichi', 'bố', 'ちちはかいしゃいんです。', 'Bố tôi là nhân viên công ty.', 2),
        ('Bài 2: Gia đình', 'はは', 'はは', 'haha', 'mẹ', 'はははりょうりがじょうずです。', 'Mẹ tôi nấu ăn rất giỏi.', 3),
        ('Bài 2: Gia đình', 'あに', 'あに', 'ani', 'anh trai', 'あにはだいがくせいです。', 'Anh trai tôi là sinh viên đại học.', 4),
        ('Bài 2: Gia đình', 'いもうと', 'いもうと', 'imouto', 'em gái', 'いもうとはこうこうせいです。', 'Em gái tôi là học sinh cấp ba.', 5),

        ('Bài 3: Số đếm', 'いち', 'いち', 'ichi', 'một', 'りんごがいちつあります。', 'Có một quả táo.', 1),
        ('Bài 3: Số đếm', 'に', 'に', 'ni', 'hai', 'ねこがにひきいます。', 'Có hai con mèo.', 2),
        ('Bài 3: Số đếm', 'さん', 'さん', 'san', 'ba', 'さんにんでべんきょうします。', 'Ba người cùng học.', 3),
        ('Bài 3: Số đếm', 'よん', 'よん', 'yon', 'bốn', 'よんじにかえります。', 'Tôi về lúc bốn giờ.', 4),
        ('Bài 3: Số đếm', 'ご', 'ご', 'go', 'năm', 'ごさつのほんがあります。', 'Có năm quyển sách.', 5),

        ('Bài 4: Thời gian', 'じかん', 'じかん', 'jikan', 'thời gian', 'じかんがありますか。', 'Bạn có thời gian không?', 1),
        ('Bài 4: Thời gian', 'きょう', 'きょう', 'kyou', 'hôm nay', 'きょうはげつようびです。', 'Hôm nay là thứ Hai.', 2),
        ('Bài 4: Thời gian', 'あした', 'あした', 'ashita', 'ngày mai', 'あしたがっこうへいきます。', 'Ngày mai tôi đi đến trường.', 3),
        ('Bài 4: Thời gian', 'あさ', 'あさ', 'asa', 'buổi sáng', 'あさろくじにおきます。', 'Buổi sáng tôi dậy lúc 6 giờ.', 4),
        ('Bài 4: Thời gian', 'ばん', 'ばん', 'ban', 'buổi tối', 'ばんにほんをよみます。', 'Buổi tối tôi đọc sách.', 5),

        ('Bài 5: Trường học', 'がっこう', 'がっこう', 'gakkou', 'trường học', 'がっこうへいきます。', 'Tôi đi đến trường.', 1),
        ('Bài 5: Trường học', 'せんせい', 'せんせい', 'sensei', 'giáo viên', 'せんせいはしんせつです。', 'Giáo viên rất tốt bụng.', 2),
        ('Bài 5: Trường học', 'きょうしつ', 'きょうしつ', 'kyoushitsu', 'lớp học', 'きょうしつはあかるいです。', 'Lớp học rất sáng.', 3),
        ('Bài 5: Trường học', 'ほん', 'ほん', 'hon', 'sách', 'ほんをよみます。', 'Tôi đọc sách.', 4),
        ('Bài 5: Trường học', 'えんぴつ', 'えんぴつ', 'enpitsu', 'bút chì', 'えんぴつでかきます。', 'Tôi viết bằng bút chì.', 5),

        ('Bài 6: Đồ ăn', 'ごはん', 'ごはん', 'gohan', 'cơm / bữa ăn', 'あさごはんをたべます。', 'Tôi ăn sáng.', 1),
        ('Bài 6: Đồ ăn', 'みず', 'みず', 'mizu', 'nước', 'みずをのみます。', 'Tôi uống nước.', 2),
        ('Bài 6: Đồ ăn', 'りんご', 'りんご', 'ringo', 'táo', 'りんごをひとつたべます。', 'Tôi ăn một quả táo.', 3),
        ('Bài 6: Đồ ăn', 'さかな', 'さかな', 'sakana', 'cá', 'さかながすきです。', 'Tôi thích cá.', 4),
        ('Bài 6: Đồ ăn', 'たまご', 'たまご', 'tamago', 'trứng', 'たまごをかいます。', 'Tôi mua trứng.', 5),

        ('Bài 7: Màu sắc', 'あか', 'あか', 'aka', 'màu đỏ', 'あかいくるまです。', 'Đó là chiếc xe màu đỏ.', 1),
        ('Bài 7: Màu sắc', 'あお', 'あお', 'ao', 'màu xanh dương', 'あおいそらがきれいです。', 'Bầu trời xanh rất đẹp.', 2),
        ('Bài 7: Màu sắc', 'しろ', 'しろ', 'shiro', 'màu trắng', 'しろいねこがいます。', 'Có một con mèo trắng.', 3),
        ('Bài 7: Màu sắc', 'くろ', 'くろ', 'kuro', 'màu đen', 'くろいかばんです。', 'Đó là chiếc cặp màu đen.', 4),
        ('Bài 7: Màu sắc', 'きいろ', 'きいろ', 'kiiro', 'màu vàng', 'きいろいはながあります。', 'Có một bông hoa màu vàng.', 5),

        ('Bài 8: Địa điểm', 'えき', 'えき', 'eki', 'ga tàu', 'えきはどこですか。', 'Ga tàu ở đâu?', 1),
        ('Bài 8: Địa điểm', 'うち', 'うち', 'uchi', 'nhà', 'うちへかえります。', 'Tôi về nhà.', 2),
        ('Bài 8: Địa điểm', 'みせ', 'みせ', 'mise', 'cửa hàng', 'みせでパンをかいます。', 'Tôi mua bánh mì ở cửa hàng.', 3),
        ('Bài 8: Địa điểm', 'こうえん', 'こうえん', 'kouen', 'công viên', 'こうえんでさんぽします。', 'Tôi đi dạo ở công viên.', 4),
        ('Bài 8: Địa điểm', 'としょかん', 'としょかん', 'toshokan', 'thư viện', 'としょかんでべんきょうします。', 'Tôi học ở thư viện.', 5),

        ('Bài 9: Phương tiện', 'でんしゃ', 'でんしゃ', 'densha', 'tàu điện', 'でんしゃでいきます。', 'Tôi đi bằng tàu điện.', 1),
        ('Bài 9: Phương tiện', 'くるま', 'くるま', 'kuruma', 'ô tô', 'くるまでかいものにいきます。', 'Tôi đi mua sắm bằng ô tô.', 2),
        ('Bài 9: Phương tiện', 'じてんしゃ', 'じてんしゃ', 'jitensha', 'xe đạp', 'じてんしゃにのります。', 'Tôi đi xe đạp.', 3),
        ('Bài 9: Phương tiện', 'バス', 'ばす', 'basu', 'xe buýt', 'バスでがっこうへいきます。', 'Tôi đi học bằng xe buýt.', 4),
        ('Bài 9: Phương tiện', 'ひこうき', 'ひこうき', 'hikouki', 'máy bay', 'ひこうきでにほんへいきます。', 'Tôi đi Nhật bằng máy bay.', 5),

        ('Bài 10: Tính từ', 'おおきい', 'おおきい', 'ookii', 'to, lớn', 'おおきいへやです。', 'Đó là căn phòng lớn.', 1),
        ('Bài 10: Tính từ', 'ちいさい', 'ちいさい', 'chiisai', 'nhỏ', 'ちいさいいぬがいます。', 'Có một con chó nhỏ.', 2),
        ('Bài 10: Tính từ', 'あたらしい', 'あたらしい', 'atarashii', 'mới', 'あたらしいほんをかいました。', 'Tôi đã mua sách mới.', 3),
        ('Bài 10: Tính từ', 'ふるい', 'ふるい', 'furui', 'cũ', 'ふるいじてんしゃです。', 'Đó là chiếc xe đạp cũ.', 4),
        ('Bài 10: Tính từ', 'たのしい', 'たのしい', 'tanoshii', 'vui', 'にほんごのじゅぎょうはたのしいです。', 'Giờ học tiếng Nhật rất vui.', 5)
) AS w(lesson_title, word, furigana, romaji, meaning, example_japanese, example_meaning, display_order)
    ON l.title = w.lesson_title;
