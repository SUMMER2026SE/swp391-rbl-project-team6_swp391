-- ============================================================
-- V29__seed_dictionary_data.sql
-- Seed basic dictionary data for student shadowing
-- This provides words for the dictionary popup feature
-- ============================================================

-- Seed vocabulary words commonly used in shadowing practice
-- These words will be used for dictionary lookup when AI is unavailable

INSERT INTO dictionary_entries (surface, lemma, reading, romaji, jlpt_level, part_of_speech, frequency)
VALUES
    -- Basic greetings
    ('こんにちは', 'こんにちは', 'こんにちは', 'konnichiwa', 'N5', 'interjection', 1),
    ('おはよう', 'おはよう', 'おはよう', 'ohayou', 'N5', 'interjection', 2),
    ('こんばんは', 'こんばんは', 'こんばんは', 'konbanwa', 'N5', 'interjection', 3),
    ('さようなら', 'さようなら', 'さようなら', 'sayounara', 'N5', 'interjection', 4),
    ('ありがとう', 'ありがとう', 'ありがとう', 'arigatou', 'N5', 'interjection', 5),
    ('すみません', 'すみません', 'すみません', 'sumimasen', 'N5', 'interjection', 6),
    ('ごめんなさい', 'ごめんなさい', 'ごめんなさい', 'gomennasai', 'N5', 'interjection', 7),
    
    -- Pronouns
    ('わたし', 'わたし', 'わたし', 'watashi', 'N5', 'pronoun', 10),
    ('きみ', 'きみ', 'きみ', 'kimi', 'N5', 'pronoun', 11),
    ('あの人', 'あの人', 'あのひと', 'anohito', 'N5', 'pronoun', 12),
    ('この人', 'この人', 'このひと', 'konohito', 'N5', 'pronoun', 13),
    
    -- Basic verbs
    ('する', 'する', 'する', 'suru', 'N5', 'verb', 20),
    ('見る', '見る', 'みる', 'miru', 'N5', 'verb', 21),
    ('聞く', '聞く', 'きく', 'kiku', 'N5', 'verb', 22),
    ('行く', '行く', 'いく', 'iku', 'N5', 'verb', 23),
    ('来る', '来る', 'くる', 'kuru', 'N5', 'verb', 24),
    ('食べる', '食べる', 'たべる', 'taberu', 'N5', 'verb', 25),
    ('飲む', '飲む', 'のむ', 'nomu', 'N5', 'verb', 26),
    ('読む', '読む', 'よむ', 'yomu', 'N5', 'verb', 27),
    ('書く', '書く', 'かく', 'kaku', 'N5', 'verb', 28),
    ('話す', '話す', 'はなす', 'hanasu', 'N5', 'verb', 29),
    ('分かる', '分かる', 'わかる', 'wakaru', 'N5', 'verb', 30),
    ('思う', '思う', 'おもう', 'omou', 'N5', 'verb', 31),
    ('作る', '作る', 'つくる', 'tsukuru', 'N5', 'verb', 32),
    ('行く', '行く', 'ゆく', 'yuku', 'N5', 'verb', 33),
    ('出る', '出る', 'でる', 'deru', 'N5', 'verb', 34),
    ('入る', '入る', 'はいる', 'hairu', 'N5', 'verb', 35),
    ('寝る', '寝る', 'ねる', 'neru', 'N5', 'verb', 36),
    ('起きる', '起きる', 'おきる', 'okiru', 'N5', 'verb', 37),
    ('待つ', '待つ', 'まつ', 'matsu', 'N5', 'verb', 38),
    ('買う', '買う', 'かう', 'kau', 'N5', 'verb', 39),
    ('使う', '使う', 'つかう', 'tsukau', 'N5', 'verb', 40),
    
    -- Basic adjectives
    ('大きい', '大きい', 'おおきい', 'ookii', 'N5', 'adjective', 50),
    ('小さい', '小さい', 'ちいさい', 'chiisai', 'N5', 'adjective', 51),
    ('新しい', '新しい', 'あたらしい', 'atarashii', 'N5', 'adjective', 52),
    ('古い', '古い', 'ふるい', 'furui', 'N5', 'adjective', 53),
    ('良い', '良い', 'よい', 'yoi', 'N5', 'adjective', 54),
    ('悪い', '悪い', 'わるい', 'warui', 'N5', 'adjective', 55),
    ('高い', '高い', 'たかい', 'takai', 'N5', 'adjective', 56),
    ('安い', '安い', 'やすい', 'yasui', 'N5', 'adjective', 57),
    ('短い', '短い', 'みじかい', 'mijikai', 'N5', 'adjective', 58),
    ('長い', '長い', 'ながい', 'nagai', 'N5', 'adjective', 59),
    ('美味しい', '美味しい', 'おいしい', 'oishii', 'N5', 'adjective', 60),
    ('寒い', '寒い', 'さむい', 'samui', 'N5', 'adjective', 61),
    ('暑い', '暑い', 'あつい', 'atsui', 'N5', 'adjective', 62),
    ('難しい', '難しい', 'むずかしい', 'muzukashii', 'N5', 'adjective', 63),
    ('易しい', '易しい', 'やさしい', 'yasashii', 'N5', 'adjective', 64),
    
    -- Particles
    ('は', 'は', 'は', 'wa', 'N5', 'particle', 70),
    ('を', 'を', 'を', 'wo', 'N5', 'particle', 71),
    ('が', 'が', 'が', 'ga', 'N5', 'particle', 72),
    ('に', 'に', 'に', 'ni', 'N5', 'particle', 73),
    ('で', 'で', 'で', 'de', 'N5', 'particle', 74),
    ('と', 'と', 'と', 'to', 'N5', 'particle', 75),
    ('の', 'の', 'の', 'no', 'N5', 'particle', 76),
    ('へ', 'へ', 'へ', 'he', 'N5', 'particle', 77),
    ('から', 'から', 'から', 'kara', 'N5', 'particle', 78),
    ('まで', 'まで', 'まで', 'made', 'N5', 'particle', 79),
    ('より', 'より', 'より', 'yori', 'N5', 'particle', 80),
    ('も', 'も', 'も', 'mo', 'N5', 'particle', 81),
    ('て', 'て', 'て', 'te', 'N5', 'particle', 82),
    ('た', 'た', 'た', 'ta', 'N5', 'particle', 83),
    ('な', 'な', 'な', 'na', 'N5', 'particle', 84),
    
    -- Common nouns
    ('人', '人', 'ひと', 'hito', 'N5', 'noun', 90),
    ('日本', '日本', 'にほん', 'nihon', 'N5', 'noun', 91),
    ('日本語', '日本語', 'にほんご', 'nihongo', 'N5', 'noun', 92),
    ('水', '水', 'みず', 'mizu', 'N5', 'noun', 93),
    ('車', '車', 'くるま', 'kuruma', 'N5', 'noun', 94),
    ('学校', '学校', 'がっこう', 'gakkou', 'N5', 'noun', 95),
    ('会社', '会社', 'かいしゃ', 'kaisha', 'N5', 'noun', 96),
    ('先生', '先生', 'せんせい', 'sensei', 'N5', 'noun', 97),
    ('友達', '友達', 'ともだち', 'tomodachi', 'N5', 'noun', 98),
    ('家族', '家族', 'かぞく', 'kazoku', 'N5', 'noun', 99),
    ('時間', '時間', 'じかん', 'jikan', 'N5', 'noun', 100),
    ('今日', '今日', 'きょう', 'kyou', 'N5', 'noun', 101),
    ('明日', '明日', 'あした', 'ashita', 'N5', 'noun', 102),
    ('昨日', '昨日', 'きのう', 'kinou', 'N5', 'noun', 103),
    ('朝', '朝', 'あさ', 'asa', 'N5', 'noun', 104),
    ('昼', '昼', 'ひる', 'hiru', 'N5', 'noun', 105),
    ('夜', '夜', 'よる', 'yoru', 'N5', 'noun', 106),
    ('週間', '週間', 'しゅうかん', 'shuukan', 'N5', 'noun', 107),
    ('月', '月', 'つき', 'tsuki', 'N5', 'noun', 108),
    ('火曜日', '火曜日', 'かようび', 'kayoubi', 'N5', 'noun', 109),
    ('水曜日', '水曜日', 'すいようび', 'suiyoubi', 'N5', 'noun', 110),
    ('木曜日', '木曜日', 'もくようび', 'mokuyoubi', 'N5', 'noun', 111),
    ('金曜日', '金曜日', 'きんようび', 'kinyoubi', 'N5', 'noun', 112),
    ('土曜日', '土曜日', 'どようび', 'doyoubi', 'N5', 'noun', 113),
    ('日曜日', '日曜日', 'にちようび', 'nichiyoubi', 'N5', 'noun', 114),
    ('電車', '電車', 'でんしゃ', 'densha', 'N5', 'noun', 115),
    ('駅', '駅', 'えき', 'eki', 'N5', 'noun', 116),
    ('建物', '建物', 'たてもの', 'tatemono', 'N5', 'noun', 117),
    ('部屋', '部屋', 'へや', 'heya', 'N5', 'noun', 118),
    ('家', '家', 'いえ', 'ie', 'N5', 'noun', 119),
    ('食堂', '食堂', 'しょくどう', 'shokudou', 'N5', 'noun', 120),
    ('銀行', '銀行', 'ぎんこう', 'ginkou', 'N5', 'noun', 121),
    ('病院', '病院', 'びょういん', 'byouin', 'N5', 'noun', 122),
    ('本', '本', 'ほん', 'hon', 'N5', 'noun', 123),
    ('新聞', '新聞', 'しんぶん', 'shinbun', 'N5', 'noun', 124),
    ('電話', '電話', 'でんわ', 'denwa', 'N5', 'noun', 125),
    ('テレビ', 'テレビ', 'テレビ', 'terebi', 'N5', 'noun', 126),
    ('映画', '映画', 'えいが', 'eiga', 'N5', 'noun', 127),
    ('音楽', '音楽', 'おんがく', 'ongaku', 'N5', 'noun', 128),
    ('料理', '料理', 'りょうり', 'ryouri', 'N5', 'noun', 129),
    ('朝ご飯', '朝ご飯', 'あさごはん', 'asagohan', 'N5', 'noun', 130),
    ('昼ご飯', '昼ご飯', 'ひるごはん', 'hirugohan', 'N5', 'noun', 131),
    ('晚ご飯', '晚ご飯', 'ばんごはん', 'bangohan', 'N5', 'noun', 132),
    ('天気', '天気', 'てんき', 'tenki', 'N5', 'noun', 133),
    ('仕事', '仕事', 'しごと', 'shigoto', 'N5', 'noun', 134),
    ('勉強', '勉強', 'べんきょう', 'benkyou', 'N5', 'noun', 135),
    ('旅行', '旅行', 'りょこう', 'ryokou', 'N5', 'noun', 136),
    ('写真', '写真', 'しゃしん', 'shashin', 'N5', 'noun', 137),
    ('花', '花', 'はな', 'hana', 'N5', 'noun', 138),
    ('山', '山', 'やま', 'yama', 'N5', 'noun', 139),
    ('海', '海', 'うみ', 'umi', 'N5', 'noun', 140),
    
    -- Numbers
    ('一', '一', 'いち', 'ichi', 'N5', 'number', 150),
    ('二', '二', 'に', 'ni', 'N5', 'number', 151),
    ('三', '三', 'さん', 'san', 'N5', 'number', 152),
    ('四', '四', 'よん', 'yon', 'N5', 'number', 153),
    ('五', '五', 'ご', 'go', 'N5', 'number', 154),
    ('六', '六', 'ろく', 'roku', 'N5', 'number', 155),
    ('七', '七', 'なな', 'nana', 'N5', 'number', 156),
    ('八', '八', 'はち', 'hachi', 'N5', 'number', 157),
    ('九', '九', 'きゅう', 'kyuu', 'N5', 'number', 158),
    ('十', '十', 'じゅう', 'juu', 'N5', 'number', 159),
    
    -- More common words
    ('いい', 'いい', 'いい', 'ii', 'N5', 'adjective', 160),
    ('とても', 'とても', 'とても', 'totemo', 'N5', 'adverb', 161),
    ('少し', '少し', 'すこし', 'sukoshi', 'N5', 'adverb', 162),
    ('とても', 'とても', 'とても', 'totemo', 'N5', 'adverb', 163),
    ('大概', '大概', 'たいがい', 'taigai', 'N5', 'adverb', 164),
    ('全然', '全然', 'ぜんぜん', 'zenzen', 'N5', 'adverb', 165),
    ('やはり', 'やはり', 'やはり', 'yahari', 'N5', 'adverb', 166),
    ('今日', '今日', 'きょう', 'kyou', 'N5', 'noun', 167),
    ('今年', '今年', 'ことし', 'kotoshi', 'N5', 'noun', 168),
    ('来年', '来年', 'らいねん', 'rainen', 'N5', 'noun', 169),
    ('去年', '去年', 'きょねん', 'kyonen', 'N5', 'noun', 170),
    ('今日', '今日', 'きょう', 'kyou', 'N5', 'noun', 171),
    ('おやすみ', 'おやすみ', 'おやすみ', 'oyasumi', 'N5', 'noun', 172),
    ('おはよう', 'おはよう', 'おはよう', 'ohayou', 'N5', 'interjection', 173),
    ('いただきます', 'いただきます', 'いただきます', 'itadakimasu', 'N5', 'expression', 174),
    ('ごちそうさま', 'ごちそうさま', 'ごちそうさま', 'gochisousama', 'N5', 'expression', 175),
    ('お願いします', 'お願いします', 'おねがいします', 'onegaishimasu', 'N5', 'expression', 176),
    ('わかりました', 'わかりました', 'わかりました', 'wakarimashita', 'N5', 'expression', 177)
ON CONFLICT DO NOTHING;

-- Now add meanings for Vietnamese (vi)
-- Link meanings to entries by matching surface and reading

DO $$
DECLARE
    entry_rec RECORD;
BEGIN
    -- Basic greetings meanings
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'こんにちは' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'xin chào', 1),
        (entry_rec.id, 'en', 'hello', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'おはよう' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'chào buổi sáng', 1),
        (entry_rec.id, 'en', 'good morning', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'こんばんは' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'chào buổi tối', 1),
        (entry_rec.id, 'en', 'good evening', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'ありがとう' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'cảm ơn', 1),
        (entry_rec.id, 'en', 'thank you', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'すみません' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'xin lỗi / cảm ơn', 1),
        (entry_rec.id, 'en', 'excuse me / thank you', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'ごめんなさい' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'xin lỗi', 1),
        (entry_rec.id, 'en', 'I am sorry', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Verbs
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'する' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'làm, thực hiện', 1),
        (entry_rec.id, 'en', 'to do', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '見る' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'nhìn, xem', 1),
        (entry_rec.id, 'en', 'to see, to look', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '聞く' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'nghe, hỏi', 1),
        (entry_rec.id, 'en', 'to hear, to ask', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '行く' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'đi', 1),
        (entry_rec.id, 'en', 'to go', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '来る' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'đến, tới', 1),
        (entry_rec.id, 'en', 'to come', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '食べる' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'ăn', 1),
        (entry_rec.id, 'en', 'to eat', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '飲む' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'uống', 1),
        (entry_rec.id, 'en', 'to drink', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '読む' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'đọc', 1),
        (entry_rec.id, 'en', 'to read', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '書く' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'viết', 1),
        (entry_rec.id, 'en', 'to write', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '話す' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'nói, nói chuyện', 1),
        (entry_rec.id, 'en', 'to speak, to talk', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '分かる' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'hiểu, biết', 1),
        (entry_rec.id, 'en', 'to understand, to know', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '思う' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'nghĩ', 1),
        (entry_rec.id, 'en', 'to think', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '作る' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'làm, tạo, chế tạo', 1),
        (entry_rec.id, 'en', 'to make, to create', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Nouns
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '人' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'người', 1),
        (entry_rec.id, 'en', 'person', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '日本' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'Nhật Bản', 1),
        (entry_rec.id, 'en', 'Japan', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '日本語' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'tiếng Nhật', 1),
        (entry_rec.id, 'en', 'Japanese language', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '水' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'nước', 1),
        (entry_rec.id, 'en', 'water', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '学校' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'trường học', 1),
        (entry_rec.id, 'en', 'school', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '先生' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'giáo viên, thầy cô', 1),
        (entry_rec.id, 'en', 'teacher', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '友達' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'bạn bè', 1),
        (entry_rec.id, 'en', 'friend', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '家族' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'gia đình', 1),
        (entry_rec.id, 'en', 'family', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '時間' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'thời gian', 1),
        (entry_rec.id, 'en', 'time', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '今日' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'hôm nay', 1),
        (entry_rec.id, 'en', 'today', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '明日' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'ngày mai', 1),
        (entry_rec.id, 'en', 'tomorrow', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '昨日' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'hôm qua', 1),
        (entry_rec.id, 'en', 'yesterday', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Adjectives
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '大きい' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'lớn', 1),
        (entry_rec.id, 'en', 'big, large', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '小さい' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'nhỏ', 1),
        (entry_rec.id, 'en', 'small', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '新しい' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'mới', 1),
        (entry_rec.id, 'en', 'new', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '古い' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'cũ', 1),
        (entry_rec.id, 'en', 'old', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '美味しい' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'ngon', 1),
        (entry_rec.id, 'en', 'delicious', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = '高い' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'cao, đắt', 1),
        (entry_rec.id, 'en', 'high, expensive, tall', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Particles
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'は' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'chủ ngữ/đề tài (trợ từ)', 1),
        (entry_rec.id, 'en', 'topic marker particle', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'を' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'đuôi đối tượng (trợ từ)', 1),
        (entry_rec.id, 'en', 'object marker particle', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'が' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'chủ ngữ (trợ từ)', 1),
        (entry_rec.id, 'en', 'subject marker particle', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'に' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'hướng tới, tại (trợ từ)', 1),
        (entry_rec.id, 'en', 'direction, location particle', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'で' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'tại, bằng, với (trợ từ)', 1),
        (entry_rec.id, 'en', 'at, by, with particle', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'と' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'và, với, hoặc (trợ từ)', 1),
        (entry_rec.id, 'en', 'and, with, or particle', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    FOR entry_rec IN SELECT id, surface FROM dictionary_entries WHERE surface = 'の' LOOP
        INSERT INTO dictionary_meanings (entry_id, language, meaning, sort_order) VALUES
        (entry_rec.id, 'vi', 'của, sở hữu (trợ từ)', 1),
        (entry_rec.id, 'en', 'possessive particle', 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
END $$;

-- Add some example sentences
DO $$
DECLARE
    entry_rec RECORD;
BEGIN
    -- 食べる examples
    FOR entry_rec IN SELECT id FROM dictionary_entries WHERE surface = '食べる' LIMIT 1 LOOP
        INSERT INTO dictionary_examples (entry_id, japanese, reading, translation, sort_order) VALUES
        (entry_rec.id, '朝ごはんを食べます。', 'あさごはんをたべます。', 'Tôi ăn sáng.', 1),
        (entry_rec.id, '寿司を食べたいです。', 'すしをたべたいです。', 'Tôi muốn ăn sushi.', 2)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 見る examples
    FOR entry_rec IN SELECT id FROM dictionary_entries WHERE surface = '見る' LIMIT 1 LOOP
        INSERT INTO dictionary_examples (entry_id, japanese, reading, translation, sort_order) VALUES
        (entry_rec.id, '映画を見ます。', 'えいがをみます。', 'Tôi xem phim.', 1),
        (entry_rec.id, 'テレビを見ません。', 'テレビをみません。', 'Tôi không xem TV.', 2)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 行く examples
    FOR entry_rec IN SELECT id FROM dictionary_entries WHERE surface = '行く' LIMIT 1 LOOP
        INSERT INTO dictionary_examples (entry_id, japanese, reading, translation, sort_order) VALUES
        (entry_rec.id, '学校に行きます。', 'がっこうにいきます。', 'Tôi đi đến trường.', 1),
        (entry_rec.id, 'どこにいきますか。', 'どこにいきますか。', 'Bạn đi đâu?', 2)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 日本 examples
    FOR entry_rec IN SELECT id FROM dictionary_entries WHERE surface = '日本' LIMIT 1 LOOP
        INSERT INTO dictionary_examples (entry_id, japanese, reading, translation, sort_order) VALUES
        (entry_rec.id, '日本は美しい国です。', 'にほんはうつくしいくにです。', 'Nhật Bản là một đất nước đẹp.', 1),
        (entry_rec.id, '日本に行きたいです。', 'にほんにいったいです。', 'Tôi muốn đi Nhật Bản.', 2)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 学校 examples
    FOR entry_rec IN SELECT id FROM dictionary_entries WHERE surface = '学校' LIMIT 1 LOOP
        INSERT INTO dictionary_examples (entry_id, japanese, reading, translation, sort_order) VALUES
        (entry_rec.id, '学校は八時に始まります。', 'がっこうははちじにはじまります。', 'Trường bắt đầu lúc 8 giờ.', 1),
        (entry_rec.id, '学校はどこですか。', 'がっこうはどこですか。', 'Trường ở đâu?', 2)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Dictionary seed data imported successfully!';
END $$;
