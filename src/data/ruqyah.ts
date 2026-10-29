/**
 * Ruqyah: duas for healing and protection, from the Quran and Sunnah.
 *
 * Authenticity (checked on sunnah.com, 30 Oct 2026):
 * - Quran items carry only a surah/ayah range; their Arabic is loaded from the validated Quran.com copy.
 * - Every Sunnah Arabic text below is copied from the sunnah.com page named in `reference`
 *   (Hisn al-Muslim pages had their decorative tatweel ـ removed; Hisn 247 had two mark typos fixed).
 * - Grades are as shown on sunnah.com, with the scholar who gave them.
 * - Left out on purpose: the "ta'jila 'afiyatik" dua (al-Hakim), not on sunnah.com so it could not be checked;
 *   the honey-and-Quran hadith (Ibn Majah 3452, graded da'if); and the "Sunnah medicines" list.
 *
 * Reading ruqyah is private: it never touches Quran progress, goals, Today ticks or the streak.
 */
import type { AdhkarItem } from '../lib/content';

export type RuqyahGrade = 'sahih' | 'hasan' | 'daif' | 'disputed' | 'athar';
export type RuqyahSection = 'quran' | 'sunnah' | 'other';
/** self = said over yourself, others = said over someone else, both = either. */
export type RuqyahAudience = 'self' | 'others' | 'both';

export type RuqyahItem = AdhkarItem & {
  id: string;
  section: RuqyahSection;
  audience: RuqyahAudience;
  /** Short line under the title on the Ruqyah screen. */
  note: string;
  grade: RuqyahGrade | null;
  /** Who graded it and how, shown in the grades sheet. */
  gradeNote: string | null;
};

export const RUQYAH_KEY = 'ruqyah';

export const GRADE_LABEL: Record<RuqyahGrade, string> = {
  sahih: 'SAHIH',
  hasan: 'HASAN',
  daif: "DA'IF",
  disputed: 'DISPUTED',
  athar: 'NOT FROM THE PROPHET ﷺ',
};

export const GRADE_INFO: { grade: RuqyahGrade; text: string }[] = [
  { grade: 'sahih', text: 'Authentic. Reliable narrators with an unbroken chain. Everything in Sahih al-Bukhari and Sahih Muslim is in this group.' },
  { grade: 'hasan', text: 'Good. Accepted and acted upon, with a slightly lighter chain than sahih.' },
  { grade: 'daif', text: 'Weak chain. Scholars differ on using these in dua and dhikr, so we show them separately and you can choose.' },
  { grade: 'disputed', text: 'Scholars graded the chain differently. Both views are given so you can decide.' },
  { grade: 'athar', text: 'The words of a scholar of the early generations, not a hadith of the Prophet ﷺ.' },
];

type Seed = Omit<RuqyahItem, 'set_key' | 'sort' | 'surah' | 'verse_from' | 'verse_to' | 'arabic' | 'translation' | 'transliteration' | 'reference' | 'repeat' | 'type'> &
  Partial<Pick<RuqyahItem, 'arabic' | 'translation' | 'transliteration' | 'reference' | 'repeat' | 'surah' | 'verse_from' | 'verse_to' | 'type'>>;

const SEEDS: Seed[] = [
  // ── From the Quran ────────────────────────────────────────────────
  {
    id: 'istiadha',
    section: 'quran',
    audience: 'both',
    title: 'Seeking refuge first',
    note: 'Before reciting',
    arabic: 'أَعُوذُ بِاللَّهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ مِنْ هَمْزِهِ وَنَفْخِهِ وَنَفْثِهِ',
    transliteration: "A'udhu billahis-Sami'il-'Alimi minash-shaytanir-rajim, min hamzihi wa nafkhihi wa nafthih.",
    translation: 'I seek refuge in Allah, the All-Hearing, the All-Knowing, from the accursed devil: from his prodding, his puffing and his blowing.',
    reference: 'Sunan Abi Dawud 775',
    grade: 'sahih',
    gradeNote: 'Sunan Abi Dawud 775 · graded sahih by al-Albani',
  },
  {
    id: 'fatihah',
    section: 'quran',
    audience: 'both',
    type: 'quran',
    title: 'Al-Fatihah',
    note: 'A Companion recited it as ruqyah and the Prophet ﷺ approved · Sahih al-Bukhari 5007',
    surah: 1,
    verse_from: 1,
    verse_to: 7,
    grade: null,
    gradeNote: null,
  },
  {
    id: 'kursi',
    section: 'quran',
    audience: 'both',
    type: 'quran',
    title: 'Ayat al-Kursi',
    note: 'A guard from Allah stays with you · Sahih al-Bukhari 5010',
    surah: 2,
    verse_from: 255,
    verse_to: 255,
    grade: null,
    gradeNote: null,
  },
  {
    id: 'baqarah_end',
    section: 'quran',
    audience: 'both',
    type: 'quran',
    title: 'End of Al-Baqarah',
    note: 'Enough for whoever recites them at night · Sahih al-Bukhari 5009',
    surah: 2,
    verse_from: 285,
    verse_to: 286,
    grade: null,
    gradeNote: null,
  },
  {
    id: 'ikhlas',
    section: 'quran',
    audience: 'both',
    type: 'quran',
    title: 'Al-Ikhlas',
    note: 'With Al-Falaq and An-Nas',
    surah: 112,
    verse_from: 1,
    verse_to: 4,
    grade: null,
    gradeNote: null,
  },
  {
    id: 'falaq',
    section: 'quran',
    audience: 'both',
    type: 'quran',
    title: 'Al-Falaq',
    note: 'The Prophet ﷺ recited these when ill and blew over himself · Sahih al-Bukhari 5016',
    surah: 113,
    verse_from: 1,
    verse_to: 5,
    grade: null,
    gradeNote: null,
  },
  {
    id: 'nas',
    section: 'quran',
    audience: 'both',
    type: 'quran',
    title: 'An-Nas',
    note: 'Sahih al-Bukhari 5016',
    surah: 114,
    verse_from: 1,
    verse_to: 6,
    grade: null,
    gradeNote: null,
  },

  // ── From the Sunnah ───────────────────────────────────────────────
  {
    id: 'bismillah_protect',
    section: 'sunnah',
    audience: 'both',
    title: 'In the name of Allah',
    note: 'Nothing harms with His name',
    arabic: 'بِسمِ اللهِ الذي لا يَضُرُّ مَعَ اسمِهِ شَيءٌ في الأرْضِ وَلا في السّماءِ وَهوَ السّميعُ العَليم',
    transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i, wa huwas-Sami'ul-'Alim.",
    translation: 'In the Name of Allah, with whose Name nothing can cause harm on earth or in the heavens, and He is the All-Hearing, the All-Knowing.',
    reference: 'Hisn al-Muslim 86 · Abu Dawud, at-Tirmidhi, Ibn Majah',
    repeat: 3,
    grade: 'hasan',
    gradeNote: "Hisn al-Muslim 86 · Ibn Majah's chain graded hasan",
  },
  {
    id: 'salawat',
    section: 'sunnah',
    audience: 'both',
    title: 'Blessings on the Prophet ﷺ',
    note: 'Begin your dua with salawat',
    arabic:
      'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ، وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ، وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ، وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration:
      "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad, kama sallayta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid. Allahumma barik 'ala Muhammadin wa 'ala ali Muhammad, kama barakta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid.",
    translation:
      'O Allah, send Your blessings on Muhammad and the family of Muhammad, as You sent blessings on Ibrahim and the family of Ibrahim; You are Praiseworthy, Most Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim; You are Praiseworthy, Most Glorious.',
    reference: 'Sahih al-Bukhari 3370',
    grade: 'sahih',
    gradeNote: 'Sahih al-Bukhari 3370',
  },
  {
    id: 'perfect_words',
    section: 'sunnah',
    audience: 'both',
    title: 'Perfect words of Allah',
    note: 'From the evil of what He created',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "A'udhu bikalimatillahit-tammati min sharri ma khalaq.",
    translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    reference: 'Sahih Muslim 2708',
    grade: 'sahih',
    gradeNote: 'Sahih Muslim 2708',
  },
  {
    id: 'rebellious_devils',
    section: 'sunnah',
    audience: 'both',
    title: 'Against the plots of devils',
    note: 'Refuge from every harm, by night and day',
    arabic:
      'أَعُوذُ بكَلِمَاتِ اللهِ التَّامَّاتِ الَّتِي لَا يُجَاوِزُهُنَّ بَرٌّ ولَا فَاجرٌ مِنْ شَرِّ مَا خَلقَ، وبَرَأَ وذَرَأَ، ومِنْ شَرِّ مَا يَنْزِلُ مِنَ السَّمَاءِ وَمِنْ شَرِّ مَا يَعْرُجُ فيهَا، ومِن شَرِّ مَا ذَرَأَ في الأَرْضِ ومِنْ شَرِّ مَا يَخْرُجُ مِنْهَا، وَمِنْ شَرِّ فِتَنِ اللَّيْلِ والنَّهارِ، ومِنْ شَرِّ كُلِّ طارِقٍ إِلَّا طَارِقاً يَطْرُقُ بخَيْرٍ يَا رَحْمَنُ',
    transliteration:
      "A'udhu bikalimatillahit-tammatil-lati la yujawizuhunna barrun wa la fajir, min sharri ma khalaqa wa bara'a wa dhara', wa min sharri ma yanzilu minas-sama'i wa min sharri ma ya'ruju fiha, wa min sharri ma dhara'a fil-ardi wa min sharri ma yakhruju minha, wa min sharri fitanil-layli wan-nahar, wa min sharri kulli tariqin illa tariqan yatruqu bikhayr, ya Rahman.",
    translation:
      'I seek refuge in the perfect words of Allah, which neither the righteous nor the wicked can go beyond, from the evil of what He created, made and scattered; from the evil of what comes down from the sky and what rises up to it; from the evil of what He scattered in the earth and what comes out of it; from the evil of the trials of night and day; and from the evil of every night visitor, except one who comes with good. O Most Merciful.',
    reference: 'Hisn al-Muslim 247 · Musnad Ahmad 3/419',
    grade: 'sahih',
    gradeNote: "Musnad Ahmad 3/419 · chain graded authentic by al-Arna'ut (as cited in Hisn al-Muslim 247)",
  },
  {
    id: 'anger_punishment',
    section: 'sunnah',
    audience: 'both',
    title: 'From His anger and punishment',
    note: 'And from the whispers of devils',
    arabic: 'أَعوذُ بِكَلِماتِ اللّهِ التّامّاتِ مِن غَضَبِهِ وَعِقابِهِ وَشَرِّ عِبادِهِ وَمِنْ هَمَزاتِ الشَّياطينِ وَأَنْ يَحْضرون',
    transliteration: "A'udhu bikalimatillahit-tammati min ghadabihi wa 'iqabihi wa sharri 'ibadih, wa min hamazatish-shayatini wa an yahdurun.",
    translation: 'I seek refuge in the perfect words of Allah from His anger and His punishment, from the evil of His servants, and from the whispers of devils and from their coming near me.',
    reference: 'Sunan Abi Dawud 3893 · Hisn al-Muslim 113',
    grade: 'hasan',
    gradeNote: 'Sunan Abi Dawud 3893 · graded hasan by al-Albani',
  },
  {
    id: 'every_devil',
    section: 'sunnah',
    audience: 'both',
    title: 'From every devil and evil eye',
    note: 'How the Prophet ﷺ protected al-Hasan and al-Husayn',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لاَمَّةٍ',
    transliteration: "A'udhu bikalimatillahit-tammati min kulli shaytanin wa hammah, wa min kulli 'aynin lammah.",
    translation: 'I seek refuge in the perfect words of Allah from every devil and every poisonous creature, and from every harmful evil eye.',
    reference: 'Sahih al-Bukhari 3371',
    grade: 'sahih',
    gradeNote: 'Sahih al-Bukhari 3371',
  },
  {
    id: 'hand_bismillah',
    section: 'sunnah',
    audience: 'self',
    title: 'Hand where it hurts',
    note: 'Put your hand where it hurts and say Bismillah 3 times',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah.',
    translation: 'In the name of Allah.',
    reference: 'Sahih Muslim 2202',
    repeat: 3,
    grade: 'sahih',
    gradeNote: 'Sahih Muslim 2202',
  },
  {
    id: 'hand_refuge',
    section: 'sunnah',
    audience: 'self',
    title: 'Hand where it hurts',
    note: 'Then say this 7 times',
    arabic: 'أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ',
    transliteration: "A'udhu billahi wa qudratihi min sharri ma ajidu wa uhadhir.",
    translation: 'I seek refuge in Allah and His power from the evil of what I feel and what I fear.',
    reference: 'Sahih Muslim 2202',
    repeat: 7,
    grade: 'sahih',
    gradeNote: 'Sahih Muslim 2202',
  },
  {
    id: 'lord_of_mankind',
    section: 'sunnah',
    audience: 'others',
    title: 'O Allah, Lord of mankind',
    note: 'Wipe your right hand over them, as the Prophet ﷺ did',
    arabic: 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَاسَ، اشْفِهِ وَأَنْتَ الشَّافِي، لاَ شِفَاءَ إِلاَّ شِفَاؤُكَ، شِفَاءً لاَ يُغَادِرُ سَقَمًا',
    transliteration: "Allahumma Rabban-nas, adhhibil-ba's, ishfihi wa antash-Shafi, la shifa'a illa shifa'uk, shifa'an la yughadiru saqama.",
    translation: 'O Allah, Lord of mankind, remove the harm and heal him, for You are the Healer. There is no healing but Your healing, a healing that leaves no illness behind.',
    reference: 'Sahih al-Bukhari 5743',
    grade: 'sahih',
    gradeNote: 'Sahih al-Bukhari 5743',
  },
  {
    id: 'arqik',
    section: 'sunnah',
    audience: 'others',
    title: 'Bismillahi arqik',
    note: 'The ruqyah Jibril recited over the Prophet ﷺ',
    arabic: 'بِاسْمِ اللَّهِ أَرْقِيكَ مِنْ كُلِّ شَىْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ بِاسْمِ اللَّهِ أَرْقِيكَ',
    transliteration: "Bismillahi arqik, min kulli shay'in yu'dhik, min sharri kulli nafsin aw 'ayni hasid, Allahu yashfik, bismillahi arqik.",
    translation: 'In the name of Allah I perform ruqyah for you, from everything that harms you, from the evil of every soul or envious eye. May Allah heal you. In the name of Allah I perform ruqyah for you.',
    reference: 'Sahih Muslim 2186',
    grade: 'sahih',
    gradeNote: 'Sahih Muslim 2186',
  },
  {
    id: 'earth_of_our_land',
    section: 'sunnah',
    audience: 'others',
    title: 'The earth of our land',
    note: 'Said over a wound or sore',
    arabic: 'بِسْمِ اللَّهِ، تُرْبَةُ أَرْضِنَا، بِرِيقَةِ بَعْضِنَا، يُشْفَى سَقِيمُنَا بِإِذْنِ رَبِّنَا',
    transliteration: "Bismillah, turbatu ardina, bi riqati ba'dina, yushfa saqimuna bi idhni Rabbina.",
    translation: 'In the name of Allah, the earth of our land with the saliva of some of us heals our sick, by the permission of our Lord.',
    reference: 'Sahih al-Bukhari 5745',
    grade: 'sahih',
    gradeNote: 'Sahih al-Bukhari 5745',
  },
  {
    id: 'ask_cure',
    section: 'sunnah',
    audience: 'others',
    title: 'Asking Allah to cure them',
    note: 'When visiting someone who is ill',
    arabic: 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ',
    transliteration: "As'alullahal-'Azima Rabbal-'Arshil-'Azimi an yashfiyak.",
    translation: 'I ask Allah the Almighty, Lord of the Mighty Throne, to heal you.',
    reference: 'Sunan Abi Dawud 3106',
    repeat: 7,
    grade: 'sahih',
    gradeNote: 'Sunan Abi Dawud 3106 · graded sahih by al-Albani (at-Tirmidhi called it hasan)',
  },
  {
    id: 'la_bas',
    section: 'sunnah',
    audience: 'others',
    title: 'No harm, a purification',
    note: 'Comfort for the one who is ill',
    arabic: 'لاَ بَأْسَ طَهُورٌ إِنْ شَاءَ اللَّهُ',
    transliteration: "La ba'sa, tahurun in sha' Allah.",
    translation: 'No harm. It is a purification, if Allah wills.',
    reference: 'Sahih al-Bukhari 5656',
    grade: 'sahih',
    gradeNote: 'Sahih al-Bukhari 5656',
  },

  // ── Other narrations (weaker, disputed or not from the Prophet ﷺ) ──
  {
    id: 'hasbiyallah',
    section: 'other',
    audience: 'both',
    title: 'Hasbiyallah',
    note: 'The words are from the Quran (9:129); the 7-times virtue is disputed',
    arabic: 'حَسْبِيَ اللّهُ لا إلهَ إلاّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ العَرْشِ العَظيم',
    transliteration: "Hasbiyallahu la ilaha illa huwa, 'alayhi tawakkaltu wa huwa Rabbul-'Arshil-'Azim.",
    translation: 'Allah is enough for me. There is no god but Him. In Him I put my trust, and He is the Lord of the Mighty Throne.',
    reference: 'Sunan Abi Dawud 5081 · Hisn al-Muslim 83',
    repeat: 7,
    grade: 'disputed',
    gradeNote:
      "Sunan Abi Dawud 5081 (words of Abu ad-Darda) · graded fabricated (mawdu') by al-Albani. Hisn al-Muslim 83 cites Ibn as-Sunni's chain to the Prophet ﷺ as sound.",
  },
  {
    id: 'our_lord_in_heaven',
    section: 'other',
    audience: 'both',
    title: 'Our Lord is Allah, in the heaven',
    note: 'Said over pain',
    arabic:
      'رَبُّنَا اللَّهُ الَّذِي فِي السَّمَاءِ تَقَدَّسَ اسْمُكَ أَمْرُكَ فِي السَّمَاءِ وَالأَرْضِ كَمَا رَحْمَتُكَ فِي السَّمَاءِ فَاجْعَلْ رَحْمَتَكَ فِي الأَرْضِ اغْفِرْ لَنَا حُوبَنَا وَخَطَايَانَا أَنْتَ رَبُّ الطَّيِّبِينَ أَنْزِلْ رَحْمَةً مِنْ رَحْمَتِكَ وَشِفَاءً مِنْ شِفَائِكَ عَلَى هَذَا الْوَجَعِ فَيَبْرَأُ',
    transliteration:
      "Rabbunallahul-ladhi fis-sama', taqaddasasmuk, amruka fis-sama'i wal-ard, kama rahmatuka fis-sama'i faj'al rahmataka fil-ard, ighfir lana hubana wa khatayana, anta Rabbut-tayyibin, anzil rahmatan min rahmatika wa shifa'an min shifa'ika 'ala hadhal-waja'.",
    translation:
      'Our Lord is Allah, who is in the heaven. Holy is Your name. Your command is in the heaven and the earth; as Your mercy is in the heaven, place Your mercy on the earth. Forgive us our sins and our mistakes; You are the Lord of the good. Send down mercy from Your mercy and healing from Your healing on this pain, so that it is cured.',
    reference: 'Sunan Abi Dawud 3892',
    grade: 'daif',
    gradeNote: "Sunan Abi Dawud 3892 · graded da'if (weak) by al-Albani",
  },
  {
    id: 'mighty_face',
    section: 'other',
    audience: 'both',
    title: 'The mighty Face of Allah',
    note: 'Words of Ka‘b al-Ahbar, recorded by Imam Malik',
    arabic:
      'أَعُوذُ بِوَجْهِ اللَّهِ الْعَظِيمِ الَّذِي لَيْسَ شَىْءٌ أَعْظَمَ مِنْهُ وَبِكَلِمَاتِ اللَّهِ التَّامَّاتِ الَّتِي لاَ يُجَاوِزُهُنَّ بَرٌّ وَلاَ فَاجِرٌ وَبِأَسْمَاءِ اللَّهِ الْحُسْنَى كُلِّهَا مَا عَلِمْتُ مِنْهَا وَمَا لَمْ أَعْلَمْ مِنْ شَرِّ مَا خَلَقَ وَبَرَأَ وَذَرَأَ',
    transliteration:
      "A'udhu bi wajhillahil-'Azimil-ladhi laysa shay'un a'zama minh, wa bi kalimatillahit-tammatil-lati la yujawizuhunna barrun wa la fajir, wa bi asma'illahil-husna kulliha ma 'alimtu minha wa ma lam a'lam, min sharri ma khalaqa wa bara'a wa dhara'.",
    translation:
      'I seek refuge in the mighty Face of Allah, than which nothing is greater, in the perfect words of Allah which neither the righteous nor the wicked can go beyond, and in all the beautiful names of Allah, those I know and those I do not, from the evil of what He created, made and scattered.',
    reference: 'Muwatta Malik, Book 51, Hadith 12',
    grade: 'athar',
    gradeNote: 'Muwatta Malik 51:12 · a saying of Ka‘b al-Ahbar, not a hadith of the Prophet ﷺ',
  },
];

export const RUQYAH: RuqyahItem[] = SEEDS.map((s, i) => ({
  set_key: RUQYAH_KEY,
  sort: i,
  type: s.type ?? 'dua',
  arabic: s.arabic ?? null,
  translation: s.translation ?? null,
  transliteration: s.transliteration ?? null,
  reference: s.reference ?? null,
  repeat: s.repeat ?? 1,
  surah: s.surah ?? null,
  verse_from: s.verse_from ?? null,
  verse_to: s.verse_to ?? null,
  ...s,
}));

export type RuqyahFor = 'self' | 'others';

/** The reading order for one person: Quran, then Sunnah, then the other narrations. */
export function ruqyahFor(who: RuqyahFor): RuqyahItem[] {
  return RUQYAH.filter((it) => it.audience === 'both' || it.audience === who);
}

/** Note shown when reading over someone else (the Arabic itself is never altered). */
export const FOR_OTHERS_NOTE =
  'Reading over someone? When you seek refuge for them, you can say u‘idhuka (“I seek refuge for you”) in place of a‘udhu, as the Prophet ﷺ did for al-Hasan and al-Husayn (Hisn al-Muslim 146). Duas said over the person who is ill are added.';
