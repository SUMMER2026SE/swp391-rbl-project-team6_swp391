-- ============================================================
-- Seed vocabulary data (N4 & N3)
-- Adds 5 N4 lessons and 5 N3 lessons with 5 words each.
--
-- Fallback logic for created_by:
--   1. First TEACHER user (if exists)
--   2. First ADMIN user (if exists)
--   3. NULL (if neither exists)
--
-- Idempotent: safe to re-run; won't duplicate data.
-- ============================================================

-- Resolve creator: TEACHER > ADMIN > NULL
WITH creator AS (
    SELECT
        COALESCE(
            (SELECT id FROM users WHERE role = 'TEACHER' ORDER BY created_at ASC LIMIT 1),
            (SELECT id FROM users WHERE role = 'ADMIN' ORDER BY created_at ASC LIMIT 1)
        ) AS user_id
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
    SELECT v.title, v.description, v.level, v.topic,
           v.estimated_minutes, v.word_count, v.is_published,
           c.user_id
    FROM (VALUES
        -- N4 Lessons
        ('Bài 1: Công việc', 'Từ vựng N4 về công việc và nơi làm việc.', 'N4', 'Work', 15, 5, TRUE),
        ('Bài 2: Cuộc sống hằng ngày', 'Từ vựng N4 về cuộc sống và thói quen.', 'N4', 'Daily Life', 15, 5, TRUE),
        ('Bài 3: Cảm xúc', 'Từ vựng N4 về cảm xúc và tâm trạng.', 'N4', 'Emotions', 15, 5, TRUE),
        ('Bài 4: Du lịch', 'Từ vựng N4 về du lịch và di chuyển.', 'N4', 'Travel', 15, 5, TRUE),
        ('Bài 5: Học tập', 'Từ vựng N4 về học tập và giáo dục.', 'N4', 'Study', 15, 5, TRUE),
        -- N3 Lessons
        ('Bài 1: Xã hội', 'Từ vựng N3 về xã hội và cộng đồng.', 'N3', 'Society', 15, 5, TRUE),
        ('Bài 2: Công nghệ', 'Từ vựng N3 về công nghệ và kỹ thuật.', 'N3', 'Technology', 15, 5, TRUE),
        ('Bài 3: Giao tiếp', 'Từ vựng N3 về giao tiếp và quan hệ.', 'N3', 'Communication', 15, 5, TRUE),
        ('Bài 4: Tính cách', 'Từ vựng N3 về tính cách con người.', 'N3', 'Personality', 15, 5, TRUE),
        ('Bài 5: Vấn đề và giải pháp', 'Từ vựng N3 về xử lý vấn đề.', 'N3', 'Problem Solving', 15, 5, TRUE)
    ) AS v(title, description, level, topic, estimated_minutes, word_count, is_published)
    CROSS JOIN creator c
    WHERE NOT EXISTS (
        SELECT 1 FROM vocabulary_lessons l
        WHERE l.title = v.title AND l.level = v.level AND l.topic = v.topic
    )
    RETURNING id, title, level
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
        -- N4 Lesson 1: Công việc
        ('Bài 1: Công việc', 'N4', '仕事', 'しごと', 'shigoto', 'công việc', '仕事は忙しいです。', 'Công việc thì bận.', 1),
        ('Bài 1: Công việc', 'N4', '会社', 'かいしゃ', 'kaisha', 'công ty', '会社に行きます。', 'Tôi đi đến công ty.', 2),
        ('Bài 1: Công việc', 'N4', '会議', 'かいぎ', 'kaigi', 'cuộc họp', '午後に会議があります。', 'Buổi chiều có cuộc họp.', 3),
        ('Bài 1: Công việc', 'N4', '働く', 'はたらく', 'hataraku', 'làm việc', '父は銀行で働いています。', 'Bố tôi đang làm việc ở ngân hàng.', 4),
        ('Bài 1: Công việc', 'N4', '給料', 'きゅうりょう', 'kyuuryou', 'lương', '給料をもらいました。', 'Tôi đã nhận lương.', 5),

        -- N4 Lesson 2: Cuộc sống hằng ngày
        ('Bài 2: Cuộc sống hằng ngày', 'N4', '生活', 'せいかつ', 'seikatsu', 'cuộc sống', '日本の生活に慣れました。', 'Tôi đã quen với cuộc sống ở Nhật.', 1),
        ('Bài 2: Cuộc sống hằng ngày', 'N4', '習慣', 'しゅうかん', 'shuukan', 'thói quen', '早く寝る習慣があります。', 'Tôi có thói quen ngủ sớm.', 2),
        ('Bài 2: Cuộc sống hằng ngày', 'N4', '準備', 'じゅんび', 'junbi', 'chuẩn bị', '旅行の準備をします。', 'Tôi chuẩn bị cho chuyến du lịch.', 3),
        ('Bài 2: Cuộc sống hằng ngày', 'N4', '必要', 'ひつよう', 'hitsuyou', 'cần thiết', 'パスポートが必要です。', 'Hộ chiếu là cần thiết.', 4),
        ('Bài 2: Cuộc sống hằng ngày', 'N4', '予定', 'よてい', 'yotei', 'dự định / lịch trình', '明日の予定があります。', 'Tôi có lịch trình ngày mai.', 5),

        -- N4 Lesson 3: Cảm xúc
        ('Bài 3: Cảm xúc', 'N4', '嬉しい', 'うれしい', 'ureshii', 'vui', 'プレゼントをもらって嬉しいです。', 'Tôi vui vì nhận được quà.', 1),
        ('Bài 3: Cảm xúc', 'N4', '悲しい', 'かなしい', 'kanashii', 'buồn', '友達が帰って悲しいです。', 'Tôi buồn vì bạn đã về.', 2),
        ('Bài 3: Cảm xúc', 'N4', '心配', 'しんぱい', 'shinpai', 'lo lắng', '試験が心配です。', 'Tôi lo lắng về kỳ thi.', 3),
        ('Bài 3: Cảm xúc', 'N4', '安心', 'あんしん', 'anshin', 'yên tâm', '家族の声を聞いて安心しました。', 'Tôi yên tâm khi nghe giọng gia đình.', 4),
        ('Bài 3: Cảm xúc', 'N4', '怒る', 'おこる', 'okoru', 'tức giận', '先生は怒りました。', 'Giáo viên đã tức giận.', 5),

        -- N4 Lesson 4: Du lịch
        ('Bài 4: Du lịch', 'N4', '旅行', 'りょこう', 'ryokou', 'du lịch', '京都へ旅行に行きます。', 'Tôi đi du lịch Kyoto.', 1),
        ('Bài 4: Du lịch', 'N4', '旅館', 'りょかん', 'ryokan', 'nhà trọ kiểu Nhật', '旅館に泊まりました。', 'Tôi đã ở nhà trọ kiểu Nhật.', 2),
        ('Bài 4: Du lịch', 'N4', '予約', 'よやく', 'yoyaku', 'đặt trước', 'ホテルを予約しました。', 'Tôi đã đặt khách sạn.', 3),
        ('Bài 4: Du lịch', 'N4', '空港', 'くうこう', 'kuukou', 'sân bay', '空港までバスで行きます。', 'Tôi đi xe buýt đến sân bay.', 4),
        ('Bài 4: Du lịch', 'N4', '案内', 'あんない', 'annai', 'hướng dẫn', '駅を案内します。', 'Tôi hướng dẫn đến nhà ga.', 5),

        -- N4 Lesson 5: Học tập
        ('Bài 5: Học tập', 'N4', '勉強', 'べんきょう', 'benkyou', 'học tập', '毎日日本語を勉強します。', 'Tôi học tiếng Nhật mỗi ngày.', 1),
        ('Bài 5: Học tập', 'N4', '説明', 'せつめい', 'setsumei', 'giải thích', '先生が文法を説明します。', 'Giáo viên giải thích ngữ pháp.', 2),
        ('Bài 5: Học tập', 'N4', '質問', 'しつもん', 'shitsumon', 'câu hỏi', '質問があります。', 'Tôi có câu hỏi.', 3),
        ('Bài 5: Học tập', 'N4', '答え', 'こたえ', 'kotae', 'câu trả lời', '答えを書いてください。', 'Hãy viết câu trả lời.', 4),
        ('Bài 5: Học tập', 'N4', '覚える', 'おぼえる', 'oboeru', 'ghi nhớ', '新しい言葉を覚えます。', 'Tôi ghi nhớ từ mới.', 5),

        -- N3 Lesson 1: Xã hội
        ('Bài 1: Xã hội', 'N3', '社会', 'しゃかい', 'shakai', 'xã hội', '社会の問題について話します。', 'Tôi nói về vấn đề xã hội.', 1),
        ('Bài 1: Xã hội', 'N3', '文化', 'ぶんか', 'bunka', 'văn hóa', '日本の文化に興味があります。', 'Tôi quan tâm đến văn hóa Nhật.', 2),
        ('Bài 1: Xã hội', 'N3', '経済', 'けいざい', 'keizai', 'kinh tế', '経済が発展しています。', 'Kinh tế đang phát triển.', 3),
        ('Bài 1: Xã hội', 'N3', '政治', 'せいじ', 'seiji', 'chính trị', '政治のニュースを見ました。', 'Tôi đã xem tin tức chính trị.', 4),
        ('Bài 1: Xã hội', 'N3', '国際', 'こくさい', 'kokusai', 'quốc tế', '国際会議に参加します。', 'Tôi tham gia hội nghị quốc tế.', 5),

        -- N3 Lesson 2: Công nghệ
        ('Bài 2: Công nghệ', 'N3', '技術', 'ぎじゅつ', 'gijutsu', 'kỹ thuật / công nghệ', '新しい技術を学びます。', 'Tôi học công nghệ mới.', 1),
        ('Bài 2: Công nghệ', 'N3', '情報', 'じょうほう', 'jouhou', 'thông tin', '情報を集めます。', 'Tôi thu thập thông tin.', 2),
        ('Bài 2: Công nghệ', 'N3', '機械', 'きかい', 'kikai', 'máy móc', 'この機械は便利です。', 'Cái máy này tiện lợi.', 3),
        ('Bài 2: Công nghệ', 'N3', '開発', 'かいはつ', 'kaihatsu', 'phát triển', 'アプリを開発しています。', 'Tôi đang phát triển ứng dụng.', 4),
        ('Bài 2: Công nghệ', 'N3', '研究', 'けんきゅう', 'kenkyuu', 'nghiên cứu', '日本語を研究しています。', 'Tôi đang nghiên cứu tiếng Nhật.', 5),

        -- N3 Lesson 3: Giao tiếp
        ('Bài 3: Giao tiếp', 'N3', '相談', 'そうだん', 'soudan', 'trao đổi / tư vấn', '先生に相談しました。', 'Tôi đã trao đổi với giáo viên.', 1),
        ('Bài 3: Giao tiếp', 'N3', '連絡', 'れんらく', 'renraku', 'liên lạc', '後で連絡します。', 'Tôi sẽ liên lạc sau.', 2),
        ('Bài 3: Giao tiếp', 'N3', '伝える', 'つたえる', 'tsutaeru', 'truyền đạt', '気持ちを伝えます。', 'Tôi truyền đạt cảm xúc.', 3),
        ('Bài 3: Giao tiếp', 'N3', '説得', 'せっとく', 'settoku', 'thuyết phục', '友達を説得しました。', 'Tôi đã thuyết phục bạn.', 4),
        ('Bài 3: Giao tiếp', 'N3', '断る', 'ことわる', 'kotowaru', 'từ chối', '招待を断りました。', 'Tôi đã từ chối lời mời.', 5),

        -- N3 Lesson 4: Tính cách
        ('Bài 4: Tính cách', 'N3', '真面目', 'まじめ', 'majime', 'nghiêm túc', '彼は真面目な学生です。', 'Anh ấy là học sinh nghiêm túc.', 1),
        ('Bài 4: Tính cách', 'N3', '積極的', 'せっきょくてき', 'sekkyokuteki', 'tích cực / chủ động', '彼女は積極的に話します。', 'Cô ấy nói chuyện rất chủ động.', 2),
        ('Bài 4: Tính cách', 'N3', '消極的', 'しょうきょくてき', 'shoukyokuteki', 'tiêu cực / thụ động', '彼は少し消極的です。', 'Anh ấy hơi thụ động.', 3),
        ('Bài 4: Tính cách', 'N3', '正直', 'しょうじき', 'shoujiki', 'thành thật', '正直に話してください。', 'Hãy nói thật.', 4),
        ('Bài 4: Tính cách', 'N3', '冷静', 'れいせい', 'reisei', 'bình tĩnh', '冷静に考えましょう。', 'Hãy suy nghĩ bình tĩnh.', 5),

        -- N3 Lesson 5: Vấn đề và giải pháp
        ('Bài 5: Vấn đề và giải pháp', 'N3', '問題', 'もんだい', 'mondai', 'vấn đề', '問題を解決します。', 'Tôi giải quyết vấn đề.', 1),
        ('Bài 5: Vấn đề và giải pháp', 'N3', '原因', 'げんいん', 'gen''in', 'nguyên nhân', '原因を調べます。', 'Tôi tìm hiểu nguyên nhân.', 2),
        ('Bài 5: Vấn đề và giải pháp', 'N3', '結果', 'けっか', 'kekka', 'kết quả', '結果を発表します。', 'Tôi công bố kết quả.', 3),
        ('Bài 5: Vấn đề và giải pháp', 'N3', '解決', 'かいけつ', 'kaiketsu', 'giải quyết', 'トラブルを解決しました。', 'Tôi đã giải quyết rắc rối.', 4),
        ('Bài 5: Vấn đề và giải pháp', 'N3', '改善', 'かいぜん', 'kaizen', 'cải thiện', '生活を改善したいです。', 'Tôi muốn cải thiện cuộc sống.', 5)
) AS w(lesson_title, level, word, furigana, romaji, meaning, example_japanese, example_meaning, display_order)
    ON l.title = w.lesson_title AND l.level = w.level
WHERE NOT EXISTS (
    SELECT 1 FROM vocabulary_words vw
    JOIN vocabulary_lessons vl ON vl.id = vw.lesson_id
    WHERE vl.title = w.lesson_title AND vl.level = w.level AND vw.word = w.word
);
