// src/features/citizen/constants/citizenTranslations.ts
// NyayaSahayak Citizen Portal Translations
// All 22 scheduled Indian languages + English with proper fallback architecture

// Base English translations (complete set)
const citizenEn = {
    // Navigation
    nav_home: 'Home',
    nav_file_complaint: 'File Complaint',
    nav_nyayapath: 'NyayaPath',
    nav_timeline: 'Timeline',
    nav_visual_justice: 'Visual Justice',
    nav_legal_hub: 'Legal Hub',
    nav_nyayabot: 'NyayaBot',
    nav_feedback: 'Feedback',
    nav_file: 'File',
    nav_track: 'Track',
    nav_bot: 'Bot',
    nav_more: 'More',

    // Welfare
    welfare_services: 'Welfare Services',
    welfare_women_safety: 'Women Safety',
    welfare_child_protection: 'Child Protection',
    welfare_free_legal_aid: 'Free Legal Aid',
    welfare_senior_care: 'Senior Care',
    welfare_victim_support: 'Victim Support',
    welfare_my_contacts: 'My Contacts',
    welfare_cybercrime: 'Cybercrime',
    welfare_accessibility: 'Accessibility',

    // Common
    logout: 'Logout',
    citizen_portal: 'Citizen Portal',
    emergency: 'Emergency?',
    call_100: 'Call 100',
    shakti: 'Shakti',
    sos: 'SOS',

    // Home Page
    namaste: 'Namaste',
    hero_tagline: 'Your gateway to justice. File complaints, track cases, and know your rights — all powered by',
    voice_fir: 'Voice FIR',
    listening: 'Listening...',
    sos_emergency: 'SOS Emergency',
    alerting: 'Alerting...',
    ai_powered_justice: 'AI-Powered Justice',
    quick_actions: 'Quick Actions',
    file_efir: 'File e-FIR',
    file_efir_desc: 'Register complaint via Voice or Text under BNSS Section 173.',
    start_now: 'Start Now',
    track_case: 'Track Case',
    track_case_desc: 'Check status, next hearing date, and evidence integrity.',
    enter_cnr: 'Enter CNR',
    legal_aid_rights: 'Legal Aid & Rights',
    legal_aid_desc: 'AI Assistant for BNS laws, bail eligibility, and legal aid.',
    ask_ai: 'Ask AI',
    my_active_cases: 'My Active Cases',
    view_all: 'View All',
    recent_updates: 'Recent Updates',
    view_all_activity: 'View All Activity',
    upcoming_hearing: 'Upcoming Hearing',
    view_case_details: 'View Case Details',
    under_investigation: 'Under Investigation',
    hearing_scheduled: 'Hearing Scheduled',
    disposed: 'Disposed',
    efir_signature_reminder: 'e-FIR Signature Reminder',
    efir_signature_desc: 'Under BNSS Section 173(2), e-FIRs must be signed within 3 days.',
    check_now: 'Check Now',
    submit_as_efir: 'Submit as e-FIR',
    clear: 'Clear',

    // Complaint Page
    complaint_file_complaint: 'File Complaint',
    complaint_subtitle: 'Register your complaint via voice or text',
    complaint_voice: 'Voice',
    complaint_type: 'Type',
    complaint_date_of_incident: 'Date of Incident',
    complaint_jurisdiction: 'Jurisdiction',
    complaint_zero_fir: 'Zero FIR (outside home district)',
    complaint_listening_tap_stop: '🎙️ Listening... Tap to Stop',
    complaint_tap_to_speak: '🎤 Tap to Speak',
    complaint_describe_incident: 'Describe your incident clearly. Include names, dates, and locations.',
    complaint_transcript: 'Transcript',
    complaint_describe_your_complaint: 'Describe Your Complaint',
    complaint_filed_successfully: 'Complaint Filed Successfully!',
    complaint_file_another: 'File Another Complaint',
    complaint_review_extracted: 'Review what the four rules found',
    complaint_submitting: 'Submitting...',
    complaint_submit_blockchain: 'Save to Ledger',

    // Track Case Page
    track_nyayapath: 'NyayaPath',
    track_subtitle: 'Track your case journey in real-time',
    track_searching: 'Searching...',
    track_track: 'Track',
    track_recently_tracked: 'Recently Tracked',
    track_case_not_found: 'Case Not Found',
    track_no_case_found: 'No case found with CNR/FIR. Please verify and try again.',
    track_action_required: 'Action Required: e-FIR Signature Pending',
    track_sign_now: 'Sign Now',
    track_generating: 'Generating...',
    track_download: 'Download',
    track_copied: 'Copied!',
    track_share: 'Share',
    track_case_journey: 'Case Journey',

    // Timeline Page
    timeline_case_timeline: 'Case Timeline',
    timeline_subtitle: 'Track the progress of your cases through the judicial system',
    timeline_back_to_cases: 'Back to all cases',
    timeline_filed_on: 'Filed On',
    timeline_status: 'Status',
    timeline_next_hearing: 'Next Hearing',

    // Visual Justice Page
    visual_justice_title: 'Visual Justice',
    visual_justice_subtitle: 'Transform complex legal text into easy-to-understand visual summaries',
    visual_generating: 'Generating...',
    visual_generate_summary: 'Generate Visual Summary',

    // Voice Filing Page
    voice_listening: 'Listening... Speak now',
    voice_processing: 'Processing Complaint...',
    voice_tap_to_speak: 'Tap to Speak',
    voice_review_details: 'Review Complaint Details',
    voice_case_filed: 'Case Filed Successfully!',
    voice_file_another: 'File Another Case',
    voice_submit_blockchain: 'Save to Ledger',
    know_your_rights: 'Know Your FIR Rights',
};

// Type for partial translations (can override any key)
type PartialTranslation = Partial<typeof citizenEn>;

// Hindi - Complete translation
const citizenHi: PartialTranslation = {
    know_your_rights: 'अपने FIR अधिकार जानें',
    nav_home: 'होम',
    nav_file_complaint: 'शिकायत दर्ज करें',
    nav_nyayapath: 'न्यायपथ',
    nav_timeline: 'समयरेखा',
    nav_visual_justice: 'दृश्य न्याय',
    nav_legal_hub: 'कानूनी केंद्र',
    nav_nyayabot: 'न्यायबॉट',
    nav_feedback: 'प्रतिक्रिया',
    nav_file: 'शिकायत',
    nav_track: 'ट्रैक',
    nav_bot: 'बॉट',
    nav_more: 'अधिक',
    welfare_services: 'कल्याण सेवाएं',
    welfare_women_safety: 'महिला सुरक्षा',
    welfare_child_protection: 'बाल सुरक्षा',
    welfare_free_legal_aid: 'मुफ्त कानूनी सहायता',
    welfare_senior_care: 'वरिष्ठ देखभाल',
    welfare_victim_support: 'पीड़ित सहायता',
    welfare_my_contacts: 'मेरे संपर्क',
    welfare_cybercrime: 'साइबर अपराध',
    welfare_accessibility: 'सुलभता',
    logout: 'लॉगआउट',
    citizen_portal: 'नागरिक पोर्टल',
    emergency: 'आपातकाल?',
    call_100: '100 पर कॉल करें',
    shakti: 'शक्ति',
    namaste: 'नमस्ते',
    hero_tagline: 'न्याय का आपका द्वार। शिकायत दर्ज करें, केस ट्रैक करें, और अपने अधिकार जानें — सब',
    voice_fir: 'वॉइस FIR',
    listening: 'सुन रहा हूं...',
    sos_emergency: 'SOS आपातकाल',
    alerting: 'सूचित कर रहे हैं...',
    ai_powered_justice: 'AI-संचालित न्याय',
    quick_actions: 'त्वरित कार्य',
    file_efir: 'e-FIR दर्ज करें',
    file_efir_desc: 'BNSS धारा 173 के तहत वॉइस या टेक्स्ट से शिकायत दर्ज करें।',
    start_now: 'अभी शुरू करें',
    track_case: 'केस ट्रैक करें',
    track_case_desc: 'स्थिति, अगली सुनवाई तिथि, और साक्ष्य अखंडता जांचें।',
    enter_cnr: 'CNR दर्ज करें',
    legal_aid_rights: 'कानूनी सहायता एवं अधिकार',
    legal_aid_desc: 'BNS कानून, जमानत पात्रता, और कानूनी सहायता के लिए AI सहायक।',
    ask_ai: 'AI से पूछें',
    my_active_cases: 'मेरे सक्रिय केस',
    view_all: 'सभी देखें',
    recent_updates: 'हाल के अपडेट',
    view_all_activity: 'सभी गतिविधि देखें',
    upcoming_hearing: 'आगामी सुनवाई',
    view_case_details: 'केस विवरण देखें',
    under_investigation: 'जांच जारी',
    hearing_scheduled: 'सुनवाई निर्धारित',
    disposed: 'निस्तारित',
    efir_signature_reminder: 'e-FIR हस्ताक्षर अनुस्मारक',
    efir_signature_desc: 'BNSS धारा 173(2) के तहत, e-FIR पर 3 दिनों के भीतर हस्ताक्षर करना आवश्यक है।',
    check_now: 'अभी जांचें',
    submit_as_efir: 'e-FIR के रूप में जमा करें',
    clear: 'साफ करें',
    // Complaint Page
    complaint_file_complaint: 'शिकायत दर्ज करें',
    complaint_subtitle: 'वॉइस या टेक्स्ट से अपनी शिकायत दर्ज करें',
    complaint_voice: 'वॉइस',
    complaint_type: 'टाइप',
    complaint_date_of_incident: 'घटना की तिथि',
    complaint_jurisdiction: 'क्षेत्राधिकार',
    complaint_zero_fir: 'जीरो FIR (गृह जिले के बाहर)',
    complaint_listening_tap_stop: '🎙️ सुन रहा हूं... रुकने के लिए टैप करें',
    complaint_tap_to_speak: '🎤 बोलने के लिए टैप करें',
    complaint_describe_incident: 'अपनी घटना का स्पष्ट वर्णन करें। नाम, तिथियां और स्थान शामिल करें।',
    complaint_transcript: 'प्रतिलिपि',
    complaint_describe_your_complaint: 'अपनी शिकायत का वर्णन करें',
    complaint_filed_successfully: 'शिकायत सफलतापूर्वक दर्ज!',
    complaint_file_another: 'एक और शिकायत दर्ज करें',
    complaint_review_extracted: 'चार नियमों ने जो खोजा, उसे देखें',
    complaint_submitting: 'जमा हो रहा है...',
    complaint_submit_blockchain: 'लेजर में सहेजें',
    // Track Case Page - Hindi
    track_nyayapath: 'न्यायपथ',
    track_subtitle: 'अपने केस की यात्रा को रियल-टाइम में ट्रैक करें',
    track_searching: 'खोज रहे हैं...',
    track_track: 'ट्रैक',
    track_recently_tracked: 'हाल में ट्रैक किए गए',
    track_case_not_found: 'केस नहीं मिला',
    track_no_case_found: 'CNR/FIR से कोई केस नहीं मिला। कृपया सत्यापित करें।',
    track_action_required: 'कार्रवाई आवश्यक: e-FIR हस्ताक्षर लंबित',
    track_sign_now: 'अभी हस्ताक्षर करें',
    track_generating: 'तैयार हो रहा है...',
    track_download: 'डाउनलोड',
    track_copied: 'कॉपी हो गया!',
    track_share: 'शेयर',
    track_case_journey: 'केस यात्रा',
    // Timeline Page - Hindi
    timeline_case_timeline: 'केस समयरेखा',
    timeline_subtitle: 'न्यायिक प्रणाली में अपने केस की प्रगति ट्रैक करें',
    timeline_back_to_cases: 'सभी केस पर वापस जाएं',
    timeline_filed_on: 'दाखिल तिथि',
    timeline_status: 'स्थिति',
    timeline_next_hearing: 'अगली सुनवाई',
    // Visual Justice Page - Hindi
    visual_justice_title: 'विजुअल न्याय',
    visual_justice_subtitle: 'जटिल कानूनी टेक्स्ट को समझने में आसान विजुअल सारांश में बदलें',
    visual_generating: 'तैयार हो रहा है...',
    visual_generate_summary: 'विजुअल सारांश बनाएं',
    // Voice Filing Page - Hindi
    voice_listening: 'सुन रहा हूं... अभी बोलें',
    voice_processing: 'शिकायत प्रोसेस हो रही है...',
    voice_tap_to_speak: 'बोलने के लिए टैप करें',
    voice_review_details: 'शिकायत विवरण की समीक्षा करें',
    voice_case_filed: 'केस सफलतापूर्वक दर्ज!',
    voice_file_another: 'एक और केस दर्ज करें',
    voice_submit_blockchain: 'लेजर में सहेजें',
};

// Bengali
const citizenBn: PartialTranslation = {
    nav_home: 'হোম', nav_file_complaint: 'অভিযোগ দায়ের', nav_nyayapath: 'ন্যায়পথ',
    nav_timeline: 'সময়রেখা', nav_visual_justice: 'দৃশ্য ন্যায়', nav_legal_hub: 'আইনি কেন্দ্র',
    nav_nyayabot: 'ন্যায়বট', nav_feedback: 'মতামত', nav_file: 'দায়ের', nav_track: 'ট্র্যাক',
    nav_bot: 'বট', nav_more: 'আরও', welfare_services: 'কল্যাণ সেবা', welfare_women_safety: 'নারী নিরাপত্তা',
    welfare_child_protection: 'শিশু সুরক্ষা', welfare_free_legal_aid: 'বিনামূল্যে আইনি সহায়তা',
    welfare_senior_care: 'প্রবীণ সেবা', welfare_victim_support: 'ভুক্তভোগী সহায়তা',
    welfare_my_contacts: 'আমার পরিচিতি', welfare_cybercrime: 'সাইবার অপরাধ',
    welfare_accessibility: 'প্রবেশযোগ্যতা', logout: 'লগআউট', citizen_portal: 'নাগরিক পোর্টাল',
    emergency: 'জরুরি?', call_100: '100 কল করুন', shakti: 'শক্তি', namaste: 'নমস্কার',
    hero_tagline: 'ন্যায়বিচারের আপনার দ্বার। অভিযোগ দায়ের করুন, মামলা ট্র্যাক করুন — সবই',
    voice_fir: 'ভয়েস FIR', listening: 'শুনছি...', sos_emergency: 'SOS জরুরি',
    alerting: 'সতর্ক করা হচ্ছে...', ai_powered_justice: 'AI-চালিত ন্যায়বিচার', quick_actions: 'দ্রুত কার্যক্রম',
    file_efir: 'e-FIR দায়ের করুন', start_now: 'এখনই শুরু করুন', track_case: 'মামলা ট্র্যাক করুন',
    enter_cnr: 'CNR দিন', legal_aid_rights: 'আইনি সাহায্য ও অধিকার', ask_ai: 'AI-কে জিজ্ঞাসা করুন',
    my_active_cases: 'আমার সক্রিয় মামলা', view_all: 'সব দেখুন', recent_updates: 'সাম্প্রতিক আপডেট',
    upcoming_hearing: 'আসন্ন শুনানি', view_case_details: 'মামলার বিবরণ দেখুন',
    check_now: 'এখনই চেক করুন', submit_as_efir: 'e-FIR হিসাবে জমা দিন', clear: 'মুছুন',
};

// Telugu
const citizenTe: PartialTranslation = {
    nav_home: 'హోమ్', nav_file_complaint: 'ఫిర్యాదు చేయండి', nav_nyayapath: 'న్యాయపథ్',
    nav_timeline: 'కాలక్రమం', nav_visual_justice: 'దృశ్య న్యాయం', nav_legal_hub: 'లీగల్ హబ్',
    nav_nyayabot: 'న్యాయబాట్', nav_feedback: 'అభిప్రాయం', nav_file: 'ఫైల్', nav_track: 'ట్రాక్',
    nav_bot: 'బాట్', nav_more: 'మరిన్ని', welfare_services: 'సంక్షేమ సేవలు', welfare_women_safety: 'మహిళా భద్రత',
    welfare_child_protection: 'బాల సంరక్షణ', welfare_free_legal_aid: 'ఉచిత న్యాయ సహాయం',
    welfare_senior_care: 'వృద్ధ సేవ', welfare_victim_support: 'బాధిత సహాయం',
    welfare_my_contacts: 'నా పరిచయాలు', welfare_cybercrime: 'సైబర్ నేరం',
    welfare_accessibility: 'అందుబాటు', logout: 'లాగ్‌అవుట్', citizen_portal: 'పౌర పోర్టల్',
    emergency: 'అత్యవసరం?', call_100: '100 కు కాల్ చేయండి', shakti: 'శక్తి', namaste: 'నమస్తే',
    hero_tagline: 'న్యాయానికి మీ ద్వారం. ఫిర్యాదులు చేయండి, కేసులను ట్రాక్ చేయండి — అన్నీ',
    voice_fir: 'వాయిస్ FIR', listening: 'వింటున్నాను...', sos_emergency: 'SOS అత్యవసరం',
    alerting: 'హెచ్చరిస్తోంది...', ai_powered_justice: 'AI-ఆధారిత న్యాయం', quick_actions: 'శీఘ్ర చర్యలు',
    file_efir: 'e-FIR ఫైల్ చేయండి', start_now: 'ఇప్పుడే ప్రారంభించండి', track_case: 'కేసు ట్రాక్ చేయండి',
    enter_cnr: 'CNR నమోదు చేయండి', legal_aid_rights: 'న్యాయ సహాయం & హక్కులు', ask_ai: 'AI ని అడగండి',
    my_active_cases: 'నా యాక్టివ్ కేసులు', view_all: 'అన్నీ చూడండి', recent_updates: 'ఇటీవలి అప్‌డేట్‌లు',
    upcoming_hearing: 'రాబోయే విచారణ', view_case_details: 'కేసు వివరాలు చూడండి',
    check_now: 'ఇప్పుడు చెక్ చేయండి', submit_as_efir: 'e-FIR గా సమర్పించండి', clear: 'క్లియర్',
};

// Tamil
const citizenTa: PartialTranslation = {
    know_your_rights: 'உங்கள் FIR உரிமைகளை அறியவும்',
    nav_home: 'முகப்பு', nav_file_complaint: 'புகார் தாக்கல்', nav_nyayapath: 'நியாயபாத்',
    nav_timeline: 'காலவரிசை', nav_visual_justice: 'காட்சி நீதி', nav_legal_hub: 'சட்ட மையம்',
    nav_nyayabot: 'நியாயபாட்', nav_feedback: 'கருத்து', nav_file: 'தாக்கல்', nav_track: 'ட்ராக்',
    nav_bot: 'பாட்', nav_more: 'மேலும்', welfare_services: 'நல சேவைகள்', welfare_women_safety: 'பெண் பாதுகாப்பு',
    welfare_child_protection: 'குழந்தை பாதுகாப்பு', welfare_free_legal_aid: 'இலவச சட்ட உதவி',
    welfare_senior_care: 'மூத்தோர் சேவை', welfare_victim_support: 'பாதிக்கப்பட்டோர் உதவி',
    welfare_my_contacts: 'எனது தொடர்புகள்', welfare_cybercrime: 'சைபர் குற்றம்',
    welfare_accessibility: 'அணுகல்', logout: 'வெளியேறு', citizen_portal: 'குடிமக்கள் போர்டல்',
    emergency: 'அவசரம்?', call_100: '100 அழைக்கவும்', shakti: 'சக்தி', namaste: 'வணக்கம்',
    hero_tagline: 'நீதிக்கான உங்கள் வாயில். புகார்களை தாக்கல் செய்யுங்கள் — அனைத்தும்',
    voice_fir: 'குரல் FIR', listening: 'கேட்கிறது...', sos_emergency: 'SOS அவசரம்',
    alerting: 'எச்சரிக்கிறது...', ai_powered_justice: 'AI-இயக்கும் நீதி', quick_actions: 'விரைவு செயல்கள்',
    file_efir: 'e-FIR தாக்கல்',
    file_efir_desc: 'BNSS பிரிவு 173 இன் கீழ் குரல் அல்லது உரை மூலம் புகார் பதிவு செய்யுங்கள்.',
    start_now: 'இப்போதே தொடங்கு',
    track_case: 'வழக்கை ட்ராக் செய்',
    track_case_desc: 'நிலை, அடுத்த விசாரணை தேதி மற்றும் ஆதார ஒருமைப்பாடு சரிபார்க்கவும்.',
    enter_cnr: 'CNR உள்ளிடு',
    legal_aid_rights: 'சட்ட உதவி & உரிமைகள்',
    legal_aid_desc: 'BNS சட்டங்கள், ஜாமீன் தகுதி மற்றும் சட்ட உதவிக்கான AI உதவியாளர்.',
    ask_ai: 'AI-ஐ கேள்',
    my_active_cases: 'எனது செயலில் உள்ள வழக்குகள்', view_all: 'அனைத்தையும் காண்க',
    recent_updates: 'சமீபத்திய புதுப்பிப்புகள்', upcoming_hearing: 'வரவிருக்கும் விசாரணை',
    view_case_details: 'வழக்கு விவரங்களைக் காண்க', check_now: 'இப்போது சரிபார்',
    submit_as_efir: 'e-FIR ஆக சமர்ப்பி', clear: 'அழி',
};

// Marathi
const citizenMr: PartialTranslation = {
    nav_home: 'होम', nav_file_complaint: 'तक्रार दाखल करा', nav_nyayapath: 'न्यायपथ',
    nav_timeline: 'टाइमलाइन', nav_visual_justice: 'दृश्य न्याय', nav_legal_hub: 'कायदे केंद्र',
    nav_nyayabot: 'न्यायबॉट', nav_feedback: 'अभिप्राय', nav_file: 'दाखल', nav_track: 'ट्रॅक',
    nav_bot: 'बॉट', nav_more: 'अधिक', welfare_services: 'कल्याण सेवा', welfare_women_safety: 'महिला सुरक्षा',
    welfare_child_protection: 'बाल संरक्षण', welfare_free_legal_aid: 'मोफत कायदेशीर मदत',
    welfare_senior_care: 'ज्येष्ठ सेवा', welfare_victim_support: 'पीडित मदत',
    welfare_my_contacts: 'माझे संपर्क', welfare_cybercrime: 'सायबर गुन्हा',
    welfare_accessibility: 'सुलभता', logout: 'लॉगआउट', citizen_portal: 'नागरिक पोर्टल',
    emergency: 'आणीबाणी?', call_100: '100 वर कॉल करा', shakti: 'शक्ती', namaste: 'नमस्कार',
    hero_tagline: 'न्यायाचे तुमचे द्वार. तक्रारी दाखल करा — सर्व काही',
    voice_fir: 'व्हॉइस FIR', listening: 'ऐकत आहे...', sos_emergency: 'SOS आणीबाणी',
    alerting: 'सूचित करत आहे...', ai_powered_justice: 'AI-संचालित न्याय', quick_actions: 'जलद कृती',
    file_efir: 'e-FIR दाखल करा', start_now: 'आता सुरू करा', track_case: 'केस ट्रॅक करा',
    enter_cnr: 'CNR प्रविष्ट करा', legal_aid_rights: 'कायदेशीर मदत आणि हक्क', ask_ai: 'AI ला विचारा',
    my_active_cases: 'माझे सक्रिय केस', view_all: 'सर्व पहा', recent_updates: 'अलीकडील अद्यतने',
    upcoming_hearing: 'आगामी सुनावणी', view_case_details: 'केस तपशील पहा',
    check_now: 'आता तपासा', submit_as_efir: 'e-FIR म्हणून सबमिट करा', clear: 'साफ करा',
};

// Gujarati
const citizenGu: PartialTranslation = {
    nav_home: 'હોમ', nav_file_complaint: 'ફરિયાદ દાખલ કરો', nav_nyayapath: 'ન્યાયપથ',
    nav_timeline: 'ટાઇમલાઇન', nav_visual_justice: 'દ્રશ્ય ન્યાય', nav_legal_hub: 'કાયદા કેન્દ્ર',
    welfare_services: 'કલ્યાણ સેવાઓ', welfare_women_safety: 'મહિલા સુરક્ષા',
    welfare_child_protection: 'બાળ સુરક્ષા', welfare_free_legal_aid: 'મફત કાયદાકીય સહાય',
    namaste: 'નમસ્તે', hero_tagline: 'ન્યાયનો તમારો દરવાજો — બધું',
    voice_fir: 'વૉઇસ FIR', listening: 'સાંભળી રહ્યું છું...', sos_emergency: 'SOS ઇમરજન્સી',
    quick_actions: 'ઝડપી ક્રિયાઓ', file_efir: 'e-FIR દાખલ કરો', start_now: 'હવે શરૂ કરો',
    track_case: 'કેસ ટ્રેક કરો', my_active_cases: 'મારા સક્રિય કેસ', view_all: 'બધું જુઓ',
};

// Kannada
const citizenKn: PartialTranslation = {
    nav_home: 'ಹೋಮ್', nav_file_complaint: 'ದೂರು ಸಲ್ಲಿಸಿ', nav_nyayapath: 'ನ್ಯಾಯಪಥ್',
    nav_timeline: 'ಟೈಮ್‌ಲೈನ್', nav_visual_justice: 'ದೃಶ್ಯ ನ್ಯಾಯ', nav_legal_hub: 'ಕಾನೂನು ಕೇಂದ್ರ',
    welfare_services: 'ಕಲ್ಯಾಣ ಸೇವೆಗಳು', welfare_women_safety: 'ಮಹಿಳಾ ಸುರಕ್ಷತೆ',
    welfare_child_protection: 'ಮಕ್ಕಳ ರಕ್ಷಣೆ', welfare_free_legal_aid: 'ಉಚಿತ ಕಾನೂನು ಸಹಾಯ',
    namaste: 'ನಮಸ್ಕಾರ', hero_tagline: 'ನ್ಯಾಯಕ್ಕೆ ನಿಮ್ಮ ದ್ವಾರ — ಎಲ್ಲವೂ',
    voice_fir: 'ವಾಯ್ಸ್ FIR', listening: 'ಕೇಳುತ್ತಿದೆ...', sos_emergency: 'SOS ತುರ್ತು',
    quick_actions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು', file_efir: 'e-FIR ಫೈಲ್ ಮಾಡಿ', start_now: 'ಈಗ ಪ್ರಾರಂಭಿಸಿ',
    track_case: 'ಕೇಸ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', my_active_cases: 'ನನ್ನ ಸಕ್ರಿಯ ಕೇಸ್‌ಗಳು', view_all: 'ಎಲ್ಲಾ ನೋಡಿ',
};

// Malayalam
const citizenMl: PartialTranslation = {
    nav_home: 'ഹോം', nav_file_complaint: 'പരാതി രജിസ്റ്റർ', nav_nyayapath: 'ന്യായപാഥ്',
    nav_timeline: 'ടൈംലൈൻ', nav_visual_justice: 'വിഷ്വൽ ജസ്റ്റിസ്', nav_legal_hub: 'ലീഗൽ ഹബ്',
    welfare_services: 'ക്ഷേമ സേവനങ്ങൾ', welfare_women_safety: 'സ്ത്രീ സുരക്ഷ',
    welfare_child_protection: 'ശിശു സംരക്ഷണം', welfare_free_legal_aid: 'സൗജന്യ നിയമ സഹായം',
    namaste: 'നമസ്കാരം', hero_tagline: 'നീതിയിലേക്കുള്ള നിങ്ങളുടെ വാതിൽ — എല്ലാം',
    voice_fir: 'വോയ്സ് FIR', listening: 'കേൾക്കുന്നു...', sos_emergency: 'SOS അടിയന്തിരം',
    quick_actions: 'ദ്രുത പ്രവർത്തനങ്ങൾ', file_efir: 'e-FIR ഫയൽ ചെയ്യുക', start_now: 'ഇപ്പോൾ ആരംഭിക്കുക',
    track_case: 'കേസ് ട്രാക്ക് ചെയ്യുക', my_active_cases: 'എന്റെ ആക്ടീവ് കേസുകൾ', view_all: 'എല്ലാം കാണുക',
};

// Punjabi
const citizenPa: PartialTranslation = {
    nav_home: 'ਹੋਮ', nav_file_complaint: 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ', namaste: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
    voice_fir: 'ਵੌਇਸ FIR', quick_actions: 'ਤੇਜ਼ ਕਾਰਵਾਈਆਂ',
};

// Odia
const citizenOr: PartialTranslation = {
    nav_home: 'ହୋମ', nav_file_complaint: 'ଅଭିଯୋଗ ଦାଖଲ କରନ୍ତୁ', namaste: 'ନମସ୍କାର',
    voice_fir: 'ଭଏସ FIR', quick_actions: 'ଶୀଘ୍ର କାର୍ଯ୍ୟ',
};

// Assamese
const citizenAs: PartialTranslation = {
    nav_home: 'হোম', nav_file_complaint: 'অভিযোগ দাখিল কৰক', namaste: 'নমস্কাৰ',
    voice_fir: 'ভইচ FIR', quick_actions: 'দ্ৰুত কাৰ্য্য',
};

// Urdu
const citizenUr: PartialTranslation = {
    nav_home: 'ہوم', nav_file_complaint: 'شکایت درج کریں', namaste: 'آداب',
    voice_fir: 'وائس FIR', quick_actions: 'فوری اقدامات', hero_tagline: 'انصاف کا آپ کا دروازہ',
};

// Other languages with basic translations
const citizenSa: PartialTranslation = { namaste: 'नमस्ते' }; // Sanskrit
const citizenKs: PartialTranslation = { namaste: 'آداب' }; // Kashmiri
const citizenNe: PartialTranslation = { namaste: 'नमस्ते' }; // Nepali
const citizenSd: PartialTranslation = { namaste: 'نمستي' }; // Sindhi
const citizenKok: PartialTranslation = { namaste: 'नमस्कार' }; // Konkani
const citizenDoi: PartialTranslation = { namaste: 'नमस्कार' }; // Dogri
const citizenMai: PartialTranslation = { namaste: 'प्रणाम' }; // Maithili
const citizenSat: PartialTranslation = { namaste: 'जोहार' }; // Santali
const citizenMni: PartialTranslation = { namaste: 'খুরুমজরি' }; // Manipuri
const citizenBrx: PartialTranslation = { namaste: 'नमस्कार' }; // Bodo

// Export all translations
export const citizenTranslations: Record<string, PartialTranslation> = {
    en: citizenEn,
    hi: citizenHi,
    bn: citizenBn,
    te: citizenTe,
    ta: citizenTa,
    mr: citizenMr,
    gu: citizenGu,
    kn: citizenKn,
    ml: citizenMl,
    pa: citizenPa,
    or: citizenOr,
    as: citizenAs,
    ur: citizenUr,
    sa: citizenSa,
    ks: citizenKs,
    ne: citizenNe,
    sd: citizenSd,
    kok: citizenKok,
    doi: citizenDoi,
    mai: citizenMai,
    sat: citizenSat,
    mni: citizenMni,
    brx: citizenBrx,
};

// English is the complete base
export const baseTranslations = citizenEn;
export type CitizenTranslationKey = keyof typeof citizenEn;
export default citizenTranslations;
