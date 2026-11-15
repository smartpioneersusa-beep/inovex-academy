/* INOVEX Academy — public pages: landing page and the Training Requirement web form.
   Loaded before app.js; app.js calls IA_PUBLIC.landing(h) and IA_PUBLIC.request(h). */
(function () {
  'use strict';
  const LANGS = ['en', 'ar', 'ur', 'hi'];
  // L(en, ar, ur, hi)
  const L = (en, ar, ur, hi) => ({ en, ar, ur, hi });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------------------------------------------------------- landing text */
  const P = {
    eyebrow: L('INOVEX Academy · Industrial training', 'أكاديمية INOVEX · التدريب الصناعي', 'INOVEX اکیڈمی · صنعتی تربیت', 'INOVEX अकादमी · औद्योगिक प्रशिक्षण'),
    h1: L('Training the people who run the line', 'نُدرّب من يُشغّلون خطوط الإنتاج', 'ان لوگوں کی تربیت جو لائن چلاتے ہیں', 'उन लोगों का प्रशिक्षण जो लाइन चलाते हैं'),
    sub: L('Practical courses for the powder, liquid and enamel coating industry — built on 14 years of field projects, for every position on the line.',
      'دورات عملية لصناعة طلاء البودرة والطلاء السائل والمينا — مبنية على 14 عاماً من المشاريع الميدانية، لكل وظيفة على خط الإنتاج.',
      'پاؤڈر، مائع اور اینامل کوٹنگ انڈسٹری کے لیے عملی کورس — 14 سال کے فیلڈ منصوبوں پر مبنی، لائن کی ہر پوزیشن کے لیے۔',
      'पाउडर, लिक्विड और एनामेल कोटिंग उद्योग के लिए व्यावहारिक कोर्स — 14 वर्षों की फ़ील्ड परियोजनाओं पर आधारित, लाइन के हर पद के लिए।'),
    ctaRequest: L('Request training for your team', 'اطلب تدريباً لفريقك', 'اپنی ٹیم کے لیے تربیت کی درخواست', 'अपनी टीम के लिए प्रशिक्षण का अनुरोध'),
    ctaSignin: L('Trainee sign in', 'دخول المتدربين', 'ٹرینی سائن اِن', 'प्रशिक्षु साइन इन'),
    ctaMine: L('Go to my courses', 'الانتقال إلى دوراتي', 'میرے کورس کھولیں', 'मेरे कोर्स खोलें'),
    motto: L('Training today … driving tomorrow', 'تدريب اليوم … قيادة الغد', 'آج کی تربیت … کل کی قیادت', 'आज का प्रशिक्षण … कल की दिशा'),
    authorisedBy: L('Authorised by', 'معتمدة من', 'منظور شدہ از', 'द्वारा अधिकृत'),
    inAssoc: L('In association with', 'بالشراكة مع', 'کے اشتراک سے', 'के सहयोग से'),
    s1: L('Years of field experience', 'عاماً من الخبرة الميدانية', 'سال کا فیلڈ تجربہ', 'वर्षों का फ़ील्ड अनुभव'),
    s2: L('Training levels, for all positions', 'مستويات تدريب لجميع الوظائف', 'تربیتی سطحیں، تمام پوزیشنوں کے لیے', 'प्रशिक्षण स्तर, सभी पदों के लिए'),
    s3: L('Languages on the online portal', 'لغات على المنصة الإلكترونية', 'آن لائن پورٹل پر زبانیں', 'ऑनलाइन पोर्टल पर भाषाएँ'),
    s4: L('Trainees qualified by Al Qemma', 'متدرب أهّلهم معهد القمة', 'القمہ کے تربیت یافتہ', 'अल क़िम्मा द्वारा प्रशिक्षित'),
    fieldsT: L('What we train', 'مجالات التدريب', 'ہم کیا سکھاتے ہیں', 'हम क्या सिखाते हैं'),
    fieldsS: L('Every stage of a coating line, from the bare part to the final inspection.', 'كل مراحل خط الطلاء، من القطعة الخام حتى الفحص النهائي.', 'کوٹنگ لائن کا ہر مرحلہ، خام پرزے سے آخری معائنے تک۔', 'कोटिंग लाइन का हर चरण, कच्चे पार्ट से अंतिम निरीक्षण तक।'),
    levelsT: L('Three levels', 'ثلاثة مستويات', 'تین سطحیں', 'तीन स्तर'),
    basic: L('Basic', 'أساسي', 'بنیادی', 'बेसिक'),
    basicD: L('Standard training package for new staff and operators: how the line works, safe operation and daily quality checks.',
      'برنامج تدريبي موحد للموظفين الجدد والمشغلين: كيف يعمل الخط، والتشغيل الآمن، وفحوص الجودة اليومية.',
      'نئے عملے اور آپریٹرز کے لیے معیاری تربیتی پیکج: لائن کیسے چلتی ہے، محفوظ آپریشن اور روزانہ کوالٹی چیک۔',
      'नए स्टाफ़ और ऑपरेटरों के लिए मानक प्रशिक्षण पैकेज: लाइन कैसे चलती है, सुरक्षित संचालन और दैनिक गुणवत्ता जाँच।'),
    pro: L('Professional', 'متقدم', 'پروفیشنل', 'प्रोफ़ेशनल'),
    proD: L('Advanced technical and hands-on training for technicians, engineers and supervisors: settings, troubleshooting, maintenance.',
      'تدريب فني متقدم وعملي للفنيين والمهندسين والمشرفين: الضبط، وحل المشكلات، والصيانة.',
      'ٹیکنیشنز، انجینئرز اور سپروائزرز کے لیے اعلیٰ تکنیکی اور عملی تربیت: سیٹنگز، خرابیوں کا حل، مرمت۔',
      'तकनीशियनों, इंजीनियरों और सुपरवाइज़रों के लिए उन्नत तकनीकी और व्यावहारिक प्रशिक्षण: सेटिंग, समस्या निवारण, रखरखाव।'),
    cust: L('Customized', 'مخصص', 'حسبِ ضرورت', 'कस्टमाइज़्ड'),
    custD: L('A program designed around your parts, your line and your problems — delivered at your factory with your own equipment.',
      'برنامج مصمم حول قطعك وخطك ومشكلاتك — يُقدَّم في مصنعك وعلى معداتك.',
      'آپ کے پرزوں، لائن اور مسائل کے مطابق تیار پروگرام — آپ کی فیکٹری میں آپ کے آلات پر۔',
      'आपके पार्ट, आपकी लाइन और आपकी समस्याओं के अनुसार बना कार्यक्रम — आपकी फ़ैक्टरी में आपके उपकरणों पर।'),
    minNote: L('Group programs from 5 trainees · price on request', 'برامج جماعية من 5 متدربين · السعر عند الطلب', 'گروپ پروگرام 5 ٹرینیز سے · قیمت درخواست پر', '5 प्रशिक्षुओं से समूह कार्यक्रम · मूल्य अनुरोध पर'),
    howT: L('How it works', 'كيف نعمل', 'طریقۂ کار', 'यह कैसे काम करता है'),
    h1t: L('Tell us what you need', 'أخبرنا باحتياجك', 'اپنی ضرورت بتائیں', 'अपनी ज़रूरत बताएँ'),
    h1d: L('Fill in the training requirement form — it takes about 5 minutes.', 'املأ نموذج متطلبات التدريب — يستغرق نحو 5 دقائق.', 'تربیتی ضروریات کا فارم بھریں — تقریباً 5 منٹ۔', 'प्रशिक्षण आवश्यकता फ़ॉर्म भरें — लगभग 5 मिनट।'),
    h2t: L('We recommend a program', 'نقترح البرنامج', 'ہم پروگرام تجویز کرتے ہیں', 'हम कार्यक्रम सुझाते हैं'),
    h2d: L('Our sales engineer proposes the level, duration and a quotation.', 'يقترح مهندس المبيعات المستوى والمدة وعرض السعر.', 'سیلز انجینئر سطح، دورانیہ اور قیمت تجویز کرتا ہے۔', 'सेल्स इंजीनियर स्तर, अवधि और कोटेशन सुझाता है।'),
    h3t: L('Train on the line', 'تدريب على الخط', 'لائن پر تربیت', 'लाइन पर प्रशिक्षण'),
    h3d: L('Theory and practice at INOVEX Academy or at your factory, in Arabic or English.', 'نظري وعملي في أكاديمية INOVEX أو في مصنعك، بالعربية أو الإنجليزية.', 'INOVEX اکیڈمی یا آپ کی فیکٹری میں نظری و عملی، عربی یا انگریزی میں۔', 'INOVEX अकादमी या आपकी फ़ैक्टरी में सिद्धांत और अभ्यास, अरबी या अंग्रेज़ी में।'),
    h4t: L('Assess and certify', 'تقييم وشهادة', 'جائزہ اور سرٹیفکیٹ', 'मूल्यांकन और प्रमाणपत्र'),
    h4d: L('Online course book, presentation and assessment on this portal, then a verifiable certificate.', 'كتاب الدورة والعرض والتقييم على هذه المنصة، ثم شهادة قابلة للتحقق.', 'اس پورٹل پر کورس بک، پریزنٹیشن اور جائزہ، پھر قابلِ تصدیق سرٹیفکیٹ۔', 'इस पोर्टल पर कोर्स बुक, प्रस्तुति और मूल्यांकन, फिर सत्यापन योग्य प्रमाणपत्र।'),
    videosT: L('See the Academy in action', 'شاهد الأكاديمية أثناء العمل', 'اکیڈمی کو عمل میں دیکھیں', 'अकादमी को काम करते देखें'),
    soon: L('Video coming soon', 'الفيديو قريباً', 'ویڈیو جلد آ رہی ہے', 'वीडियो जल्द आ रहा है'),
    onlineT: L('Online courses', 'الدورات الإلكترونية', 'آن لائن کورس', 'ऑनलाइन कोर्स'),
    onlineS: L('Online courses are included with INOVEX training packages. Your company receives access codes — each opens 30 days of course book, web presentation and assessment in your language.',
      'الدورات الإلكترونية مشمولة مع باقات تدريب INOVEX. تحصل شركتك على رموز وصول — كل رمز يفتح 30 يوماً من كتاب الدورة والعرض والتقييم بلغتك.',
      'آن لائن کورس INOVEX تربیتی پیکجز میں شامل ہیں۔ آپ کی کمپنی کو رسائی کوڈ ملتے ہیں — ہر کوڈ 30 دن کے لیے کورس بک، پریزنٹیشن اور جائزہ کھولتا ہے۔',
      'ऑनलाइन कोर्स INOVEX प्रशिक्षण पैकेज में शामिल हैं। आपकी कंपनी को एक्सेस कोड मिलते हैं — हर कोड आपकी भाषा में 30 दिनों के लिए कोर्स बुक, प्रस्तुति और मूल्यांकन खोलता है।'),
    haveCode: L('Have an access code? Create your account', 'لديك رمز وصول؟ أنشئ حسابك', 'رسائی کوڈ ہے؟ اکاؤنٹ بنائیں', 'एक्सेस कोड है? खाता बनाएँ'),
    pc101: L('Powder Coating Fundamentals', 'أساسيات الطلاء بالبودرة', 'پاؤڈر کوٹنگ کی بنیادی باتیں', 'पाउडर कोटिंग की बुनियादी बातें'),
    pc101d: L('8 modules · 25-slide presentation · 30-question assessment · certificate', '8 وحدات · عرض من 25 شريحة · تقييم من 30 سؤالاً · شهادة', '8 ماڈیول · 25 سلائیڈز · 30 سوالات · سرٹیفکیٹ', '8 मॉड्यूल · 25 स्लाइड · 30 प्रश्न · प्रमाणपत्र'),
    more: L('More courses are on the way', 'دورات أخرى قيد الإعداد', 'مزید کورس تیار ہو رہے ہیں', 'और कोर्स आ रहे हैं'),
    moreD: L('Liquid painting, surface preparation, spray guns and pumps, automation, maintenance.', 'الطلاء السائل، تجهيز الأسطح، مسدسات الرش والمضخات، الأتمتة، الصيانة.', 'مائع پینٹنگ، سطح کی تیاری، اسپرے گن اور پمپ، آٹومیشن، مرمت۔', 'लिक्विड पेंटिंग, सतह तैयारी, स्प्रे गन और पंप, ऑटोमेशन, रखरखाव।'),
    ticker: [L('INOVEX — KSA', 'INOVEX — المملكة العربية السعودية', 'INOVEX — سعودی عرب', 'INOVEX — सऊदी अरब'),
      L('Al Qemma Institute — KSA', 'معهد القمة — المملكة العربية السعودية', 'القمہ انسٹی ٹیوٹ — سعودی عرب', 'अल क़िम्मा इंस्टीट्यूट — सऊदी अरब'),
      L('WAGNER Group — Germany / Italy', 'مجموعة WAGNER — ألمانيا / إيطاليا', 'WAGNER گروپ — جرمنی / اٹلی', 'WAGNER ग्रुप — जर्मनी / इटली'),
      L('Saudi Vision 2030', 'رؤية السعودية 2030', 'سعودی ویژن 2030', 'सऊदी विज़न 2030')],
    partnersT: L('Our partners', 'شركاؤنا', 'ہمارے شراکت دار', 'हमारे साझेदार'),
    wagD: L('INOVEX is the authorised WAGNER reseller in the GCC and Middle East. Our courses are authorised by Wagner Group, and WAGNER equipment training is delivered through INOVEX Academy by trained INOVEX engineers.',
      'INOVEX هي الموزع المعتمد لـ WAGNER في الخليج والشرق الأوسط. دوراتنا معتمدة من مجموعة Wagner، ويُقدَّم التدريب على معدات WAGNER عبر أكاديمية INOVEX بواسطة مهندسين مدرّبين.',
      'INOVEX خلیج اور مشرقِ وسطیٰ میں WAGNER کا منظور شدہ ری سیلر ہے۔ ہمارے کورس Wagner گروپ سے منظور شدہ ہیں اور WAGNER آلات کی تربیت INOVEX اکیڈمی کے ذریعے دی جاتی ہے۔',
      'INOVEX खाड़ी और मध्य पूर्व में WAGNER का अधिकृत रीसेलर है। हमारे कोर्स Wagner Group द्वारा अधिकृत हैं, और WAGNER उपकरण प्रशिक्षण INOVEX अकादमी के माध्यम से दिया जाता है।'),
    qemD: L('Al Qemma Training Institute is a Saudi training institute with programs accredited by the Technical and Vocational Training Corporation (TVTC). It has qualified more than 3,500 trainees across sectors in Saudi Arabia and the Gulf.',
      'معهد القمة للتدريب معهد سعودي ذو برامج معتمدة من المؤسسة العامة للتدريب التقني والمهني، وقد أهّل أكثر من 3,500 متدرب من مختلف القطاعات في المملكة والخليج.',
      'القمہ ٹریننگ انسٹیٹیوٹ ایک سعودی ادارہ ہے جس کے پروگرام TVTC سے منظور شدہ ہیں۔ اس نے سعودی عرب اور خلیج میں 3,500 سے زائد افراد کو تربیت دی ہے۔',
      'अल क़िम्मा ट्रेनिंग इंस्टीट्यूट एक सऊदी संस्थान है जिसके कार्यक्रम TVTC से मान्यता प्राप्त हैं। इसने सऊदी अरब और खाड़ी में 3,500 से अधिक प्रशिक्षुओं को प्रशिक्षित किया है।'),
    wagName: L('Wagner Group', 'مجموعة Wagner', 'Wagner گروپ', 'Wagner Group'),
    qemName: L('Al Qemma Training Institute', 'معهد القمة للتدريب', 'القمہ ٹریننگ انسٹیٹیوٹ', 'अल क़िम्मा ट्रेनिंग इंस्टीट्यूट'),
    bandT: L('Ready to train your team?', 'هل أنت مستعد لتدريب فريقك؟', 'کیا آپ اپنی ٹیم کی تربیت کے لیے تیار ہیں؟', 'क्या आप अपनी टीम को प्रशिक्षित करने के लिए तैयार हैं?'),
    bandD: L('Send us your training requirements and we will reply within two working days.', 'أرسل لنا متطلبات التدريب وسنرد خلال يومي عمل.', 'اپنی تربیتی ضروریات بھیجیں، ہم دو کاروباری دنوں میں جواب دیں گے۔', 'अपनी प्रशिक्षण आवश्यकताएँ भेजें, हम दो कार्य दिवसों में उत्तर देंगे।'),
    call: L('Call', 'اتصال', 'کال کریں', 'कॉल करें'),
    faqT: L('Frequently asked questions', 'الأسئلة الشائعة', 'اکثر پوچھے گئے سوالات', 'अक्सर पूछे जाने वाले प्रश्न'),
    formats: L('Theory · Practical · Both — at INOVEX Academy or at your factory', 'نظري · عملي · كلاهما — في أكاديمية INOVEX أو في مصنعك', 'نظری · عملی · دونوں — INOVEX اکیڈمی یا آپ کی فیکٹری میں', 'सिद्धांत · व्यावहारिक · दोनों — INOVEX अकादमी या आपकी फ़ैक्टरी में')
  };
  const FIELDS = [
    ['powder', '◆', L('Powder coating', 'طلاء البودرة', 'پاؤڈر کوٹنگ', 'पाउडर कोटिंग')],
    ['liquid', '◈', L('Liquid painting', 'الطلاء السائل', 'مائع پینٹنگ', 'लिक्विड पेंटिंग')],
    ['surface', '▦', L('Surface preparation', 'تجهيز الأسطح', 'سطح کی تیاری', 'सतह की तैयारी')],
    ['application', '➶', L('Application technology', 'تقنية التطبيق', 'اپلیکیشن ٹیکنالوجی', 'अनुप्रयोग तकनीक')],
    ['ovens', '♨', L('Curing ovens', 'أفران المعالجة', 'کیورنگ اوون', 'क्योरिंग ओवन')],
    ['guns', '⌁', L('Spray guns', 'مسدسات الرش', 'اسپرے گن', 'स्प्रे गन')],
    ['pumps', '⟳', L('Pumps', 'المضخات', 'پمپ', 'पंप')],
    ['automation', '⚙', L('Automation & robotics', 'الأتمتة والروبوتات', 'آٹومیشن اور روبوٹکس', 'ऑटोमेशन और रोबोटिक्स')],
    ['quality', '✓', L('Quality & inspection', 'الجودة والفحص', 'کوالٹی اور معائنہ', 'गुणवत्ता और निरीक्षण')],
    ['maintenance', '⚒', L('Maintenance', 'الصيانة', 'مرمت', 'रखरखाव')],
    ['troubleshooting', '⚑', L('Troubleshooting', 'حل المشكلات', 'خرابیوں کا حل', 'समस्या निवारण')]
  ];


  const FAQ = [
    [L('Who are INOVEX Academy courses for?', 'لمن صُممت دورات أكاديمية INOVEX؟', 'INOVEX اکیڈمی کے کورس کس کے لیے ہیں؟', 'INOVEX अकादमी के कोर्स किसके लिए हैं?'),
     L('For everyone who works on a coating line: operators, technicians, maintenance and quality staff, engineers, supervisors and sales engineers in powder coating, liquid painting and enamel plants.',
       'لكل من يعمل على خط الطلاء: المشغلون والفنيون وفرق الصيانة والجودة والمهندسون والمشرفون ومهندسو المبيعات في مصانع طلاء البودرة والطلاء السائل والمينا.',
       'کوٹنگ لائن پر کام کرنے والے ہر فرد کے لیے: آپریٹرز، ٹیکنیشنز، مرمت اور کوالٹی عملہ، انجینئرز، سپروائزرز اور سیلز انجینئرز۔',
       'कोटिंग लाइन पर काम करने वाले हर व्यक्ति के लिए: ऑपरेटर, तकनीशियन, रखरखाव और गुणवत्ता स्टाफ़, इंजीनियर, सुपरवाइज़र और सेल्स इंजीनियर।')],
    [L('Where is the training delivered?', 'أين يُقدَّم التدريب؟', 'تربیت کہاں دی جاتی ہے؟', 'प्रशिक्षण कहाँ दिया जाता है?'),
     L('At INOVEX Academy in Riyadh or at your factory anywhere in Saudi Arabia and the GCC — theory, hands-on practice on real equipment, or both.',
       'في أكاديمية INOVEX بالرياض أو في مصنعك في أي مكان بالمملكة ودول الخليج — نظري أو عملي على معدات حقيقية أو كلاهما.',
       'ریاض میں INOVEX اکیڈمی میں یا سعودی عرب اور خلیج میں آپ کی فیکٹری میں — نظری، اصل آلات پر عملی، یا دونوں۔',
       'रियाद में INOVEX अकादमी में या सऊदी अरब और खाड़ी में आपकी फ़ैक्टरी में — सिद्धांत, वास्तविक उपकरणों पर अभ्यास, या दोनों।')],
    [L('In which languages?', 'بأي لغات؟', 'کن زبانوں میں؟', 'किन भाषाओं में?'),
     L('Classroom and on-site training in Arabic or English. The online course book, presentation and assessment are available in English, Arabic, Urdu and Hindi.',
       'التدريب الحضوري والميداني بالعربية أو الإنجليزية، والمواد الإلكترونية (كتاب الدورة والعرض والتقييم) متاحة بالإنجليزية والعربية والأردية والهندية.',
       'کلاس روم اور فیکٹری میں تربیت عربی یا انگریزی میں۔ آن لائن کورس بک، پریزنٹیشن اور جائزہ انگریزی، عربی، اردو اور ہندی میں۔',
       'कक्षा और साइट पर प्रशिक्षण अरबी या अंग्रेज़ी में। ऑनलाइन कोर्स बुक, प्रस्तुति और मूल्यांकन अंग्रेज़ी, अरबी, उर्दू और हिन्दी में।')],
    [L('How do trainees get access to the online courses?', 'كيف يحصل المتدربون على الدورات الإلكترونية؟', 'ٹرینیز کو آن لائن کورس تک رسائی کیسے ملتی ہے؟', 'प्रशिक्षुओं को ऑनलाइन कोर्स कैसे मिलते हैं?'),
     L('Online courses are included with INOVEX training packages. Each company receives access codes; every code opens 30 days of access on this portal.',
       'الدورات الإلكترونية مشمولة مع باقات تدريب INOVEX. تحصل كل شركة على رموز وصول، وكل رمز يفتح 30 يوماً على هذه المنصة.',
       'آن لائن کورس INOVEX تربیتی پیکجز میں شامل ہیں۔ ہر کمپنی کو رسائی کوڈ ملتے ہیں؛ ہر کوڈ 30 دن کی رسائی دیتا ہے۔',
       'ऑनलाइन कोर्स INOVEX प्रशिक्षण पैकेज में शामिल हैं। हर कंपनी को एक्सेस कोड मिलते हैं; हर कोड 30 दिनों की पहुँच देता है।')],
    [L('Do trainees receive a certificate?', 'هل يحصل المتدربون على شهادة؟', 'کیا ٹرینیز کو سرٹیفکیٹ ملتا ہے؟', 'क्या प्रशिक्षुओं को प्रमाणपत्र मिलता है?'),
     L('Yes. Completion, attendance or qualification certificates are issued by INOVEX Academy, authorised by Wagner Group and in association with Al Qemma Training Institute. Every certificate has an ID that anyone can verify online.',
       'نعم، تُصدر أكاديمية INOVEX شهادات إتمام أو حضور أو تأهيل، معتمدة من مجموعة Wagner وبالشراكة مع معهد القمة، ولكل شهادة رقم يمكن التحقق منه إلكترونياً.',
       'جی ہاں۔ INOVEX اکیڈمی تکمیل، حاضری یا اہلیت کے سرٹیفکیٹ جاری کرتی ہے؛ ہر سرٹیفکیٹ کا نمبر آن لائن تصدیق کیا جا سکتا ہے۔',
       'हाँ। INOVEX अकादमी पूर्णता, उपस्थिति या योग्यता प्रमाणपत्र जारी करती है; हर प्रमाणपत्र की संख्या ऑनलाइन सत्यापित की जा सकती है।')],
    [L('How do we request training for our team?', 'كيف نطلب تدريباً لفريقنا؟', 'اپنی ٹیم کے لیے تربیت کیسے طلب کریں؟', 'अपनी टीम के लिए प्रशिक्षण कैसे माँगें?'),
     L('Fill in the training requirement form on this page or contact us on WhatsApp +966 50 962 0944. We reply within two working days with a recommended program and quotation.',
       'املأ نموذج متطلبات التدريب في هذه الصفحة أو تواصل معنا عبر واتساب ‎+966 50 962 0944، وسنرد خلال يومي عمل بالبرنامج المقترح وعرض السعر.',
       'اس صفحے پر تربیتی ضروریات کا فارم بھریں یا واٹس ایپ ‎+966 50 962 0944 پر رابطہ کریں۔ ہم دو کاروباری دنوں میں جواب دیتے ہیں۔',
       'इस पेज पर प्रशिक्षण आवश्यकता फ़ॉर्म भरें या WhatsApp +966 50 962 0944 पर संपर्क करें। हम दो कार्य दिवसों में उत्तर देते हैं।')]
  ];

  /* ---------------------------------------------------------------- the Training Requirement Form (from the Word/PDF form) */
  // field: [key, type, label, options|extra]
  const O = (k, en, ar, ur, hi) => ({ k, l: L(en, ar, ur, hi) });
  const FORM = [
    { id: 's1', t: L('Customer information', 'معلومات العميل', 'گاہک کی معلومات', 'ग्राहक जानकारी'), f: [
      { k: 'company', type: 'text', req: 1, l: L('Company name', 'اسم الشركة', 'کمپنی کا نام', 'कंपनी का नाम') },
      { k: 'contact', type: 'text', req: 1, l: L('Contact person', 'الشخص المسؤول', 'رابطہ شخص', 'संपर्क व्यक्ति') },
      { k: 'title', type: 'text', l: L('Job title', 'المسمى الوظيفي', 'عہدہ', 'पद') },
      { k: 'industry', type: 'text', l: L('Industry / sector', 'القطاع الصناعي', 'صنعت / شعبہ', 'उद्योग / क्षेत्र') },
      { k: 'address', type: 'text', l: L('Address / city', 'العنوان / المدينة', 'پتہ / شہر', 'पता / शहर') },
      { k: 'phone', type: 'tel', req: 1, l: L('Contact number', 'رقم التواصل', 'رابطہ نمبر', 'संपर्क नंबर') },
      { k: 'email', type: 'email', req: 1, l: L('Email address', 'البريد الإلكتروني', 'ای میل', 'ईमेल') }
    ] },
    { id: 's2', t: L('Training need', 'تحديد الاحتياج التدريبي', 'تربیتی ضرورت', 'प्रशिक्षण आवश्यकता'), f: [
      { k: 'objective', type: 'multi', req: 1, other: 1, l: L('Main training objective', 'الهدف الرئيسي من التدريب', 'تربیت کا بنیادی مقصد', 'प्रशिक्षण का मुख्य उद्देश्य'), o: [
        O('New employee training', 'New employee training', 'تدريب موظفين جدد', 'نئے ملازمین کی تربیت', 'नए कर्मचारियों का प्रशिक्षण'),
        O('Team upskilling', 'Team upskilling', 'رفع كفاءة الفريق', 'ٹیم کی مہارت میں اضافہ', 'टीम कौशल उन्नयन'),
        O('Technicians & operators', 'Technicians & operators', 'تأهيل فنيين ومشغلين', 'ٹیکنیشنز اور آپریٹرز', 'तकनीशियन और ऑपरेटर'),
        O('Quality improvement', 'Quality improvement', 'تحسين الجودة', 'کوالٹی میں بہتری', 'गुणवत्ता सुधार'),
        O('Troubleshooting', 'Troubleshooting', 'معالجة مشاكل فنية', 'تکنیکی مسائل کا حل', 'समस्या निवारण'),
        O('Production optimization', 'Production optimization', 'تحسين الإنتاج', 'پیداوار میں بہتری', 'उत्पादन अनुकूलन'),
        O('Reduce powder consumption', 'Reduce powder consumption', 'تقليل استهلاك البودرة', 'پاؤڈر کی کھپت میں کمی', 'पाउडर खपत घटाना'),
        O('Reduce reject rate', 'Reduce reject rate', 'تقليل الرفض', 'مسترد شدہ پرزوں میں کمی', 'अस्वीकृति दर घटाना'),
        O('New technologies', 'New technologies', 'تقنيات جديدة', 'نئی ٹیکنالوجیز', 'नई तकनीकें')] },
      { k: 'field', type: 'multi', req: 1, other: 1, l: L('Required training field', 'المجال المطلوب للتدريب', 'مطلوبہ تربیتی شعبہ', 'आवश्यक प्रशिक्षण क्षेत्र'), o: FIELDS.map(f => ({ k: f[2].en, l: f[2] })) }
    ] },
    { id: 's3', t: L('Trainee profile', 'مستوى المتدربين', 'ٹرینیز کا پروفائل', 'प्रशिक्षु प्रोफ़ाइल'), f: [
      { k: 'experience', type: 'single', l: L('Experience level', 'مستوى الخبرة', 'تجربے کی سطح', 'अनुभव स्तर'), o: [
        O('Beginner', 'Beginner', 'مبتدئ', 'مبتدی', 'शुरुआती'), O('< 1 year', '< 1 year', 'أقل من سنة', 'ایک سال سے کم', '1 वर्ष से कम'),
        O('1–3 years', '1–3 years', '1–3 سنوات', '1–3 سال', '1–3 वर्ष'), O('3–5 years', '3–5 years', '3–5 سنوات', '3–5 سال', '3–5 वर्ष'),
        O('> 5 years', '> 5 years', 'أكثر من 5 سنوات', '5 سال سے زیادہ', '5 वर्ष से अधिक')] },
      { k: 'positions', type: 'multi', l: L('Trainee positions', 'وظائف المتدربين', 'ٹرینیز کی پوزیشنیں', 'प्रशिक्षुओं के पद'), o: [
        O('Production', 'Production', 'الإنتاج', 'پیداوار', 'उत्पादन'), O('Maintenance', 'Maintenance', 'الصيانة', 'مرمت', 'रखरखाव'),
        O('Quality', 'Quality', 'الجودة', 'کوالٹی', 'गुणवत्ता'), O('Engineering', 'Engineering', 'الهندسة', 'انجینئرنگ', 'इंजीनियरिंग'),
        O('Supervisors', 'Supervisors', 'المشرفون', 'سپروائزرز', 'सुपरवाइज़र'), O('Management', 'Management', 'الإدارة', 'انتظامیہ', 'प्रबंधन'),
        O('Sales', 'Sales', 'المبيعات', 'سیلز', 'बिक्री'), O('Operators', 'Operators', 'المشغلون', 'آپریٹرز', 'ऑपरेटर')] },
      { k: 'trainees', type: 'number', req: 1, l: L('Expected number of trainees', 'عدد المتدربين المتوقع', 'متوقع ٹرینیز کی تعداد', 'अपेक्षित प्रशिक्षुओं की संख्या') },
      { k: 'participation', type: 'single', l: L('Participation type', 'نوع المشاركة', 'شرکت کی قسم', 'भागीदारी प्रकार'), o: [
        O('Individual', 'Individual', 'فردي', 'انفرادی', 'व्यक्तिगत'), O('Group', 'Group', 'مجموعة', 'گروپ', 'समूह')] }
    ] },
    { id: 's4', t: L('Training format', 'شكل الدورة', 'تربیت کی شکل', 'प्रशिक्षण प्रारूप'), f: [
      { k: 'type', type: 'single', l: L('Training type', 'نوع التدريب', 'تربیت کی قسم', 'प्रशिक्षण प्रकार'), o: [
        O('Theory only', 'Theory only', 'نظري فقط', 'صرف نظری', 'केवल सिद्धांत'), O('Practical only', 'Practical only', 'عملي فقط', 'صرف عملی', 'केवल व्यावहारिक'),
        O('Theory + practical', 'Theory + practical', 'نظري + عملي', 'نظری + عملی', 'सिद्धांत + व्यावहारिक')] },
      { k: 'location', type: 'single', other: 1, l: L('Training location', 'مكان التدريب', 'تربیت کی جگہ', 'प्रशिक्षण स्थान'), o: [
        O('INOVEX Academy / Institute', 'INOVEX Academy / Institute', 'أكاديمية / معهد INOVEX', 'INOVEX اکیڈمی / ادارہ', 'INOVEX अकादमी / संस्थान'),
        O('Client factory', 'Client factory', 'مصنع العميل', 'گاہک کی فیکٹری', 'ग्राहक की फ़ैक्टरी')] },
      { k: 'language', type: 'single', l: L('Training language', 'لغة التدريب', 'تربیت کی زبان', 'प्रशिक्षण भाषा'), o: [
        O('Arabic', 'Arabic', 'العربية', 'عربی', 'अरबी'), O('English', 'English', 'الإنجليزية', 'انگریزی', 'अंग्रेज़ी'), O('Arabic + English', 'Arabic + English', 'العربية + الإنجليزية', 'عربی + انگریزی', 'अरबी + अंग्रेज़ी')] },
      { k: 'dates', type: 'text', l: L('Preferred dates', 'التواريخ المفضلة', 'ترجیحی تاریخیں', 'पसंदीदा तिथियाँ') }
    ] },
    { id: 's5', t: L('Training level & specialization', 'مستوى التخصص', 'تربیت کی سطح اور تخصص', 'प्रशिक्षण स्तर और विशेषज्ञता'), f: [
      { k: 'level', type: 'single', l: L('Training level', 'مستوى الدورة', 'کورس کی سطح', 'कोर्स स्तर'), o: [
        O('Basic', 'Basic', 'أساسي', 'بنیادی', 'बेसिक'), O('Intermediate', 'Intermediate', 'متوسط', 'درمیانی', 'मध्यम'),
        O('Advanced', 'Advanced', 'متقدم', 'اعلیٰ', 'उन्नत'), O('Professional / specialist', 'Professional / specialist', 'تخصصي', 'پروفیشنل / ماہر', 'प्रोफ़ेशनल / विशेषज्ञ'),
        O('Customized', 'Customized', 'مخصص للعميل', 'گاہک کے مطابق', 'कस्टमाइज़्ड')] },
      { k: 'problem', type: 'yesno', detail: L('Details', 'التفاصيل', 'تفصیل', 'विवरण'), l: L('Is there a specific technical problem?', 'هل توجد مشكلة فنية محددة؟', 'کیا کوئی خاص تکنیکی مسئلہ ہے؟', 'क्या कोई विशिष्ट तकनीकी समस्या है?') },
      { k: 'equipment', type: 'yesno', detail: L('Equipment', 'المعدات', 'آلات', 'उपकरण'), l: L('Does the training require real equipment?', 'هل يتطلب التدريب معدات حقيقية؟', 'کیا تربیت کے لیے اصل آلات درکار ہیں؟', 'क्या प्रशिक्षण के लिए वास्तविक उपकरण चाहिए?') }
    ] },
    { id: 's6', t: L('Certification', 'الشهادة', 'سرٹیفکیشن', 'प्रमाणन'), f: [
      { k: 'certificate', type: 'single', l: L('Certificate required?', 'هل يرغب العميل بشهادة إتمام؟', 'کیا سرٹیفکیٹ درکار ہے؟', 'क्या प्रमाणपत्र चाहिए?'), o: [
        O('Yes', 'Yes', 'نعم', 'ہاں', 'हाँ'), O('No', 'No', 'لا', 'نہیں', 'नहीं')] },
      { k: 'certType', type: 'multi', l: L('Certificate type', 'نوع الشهادة', 'سرٹیفکیٹ کی قسم', 'प्रमाणपत्र प्रकार'), o: [
        O('INOVEX', 'INOVEX', 'INOVEX', 'INOVEX', 'INOVEX'), O('INOVEX + partners', 'INOVEX + partners', 'INOVEX + الشركاء', 'INOVEX + شراکت دار', 'INOVEX + साझेदार'),
        O('Certificate of attendance', 'Certificate of attendance', 'شهادة حضور', 'حاضری سرٹیفکیٹ', 'उपस्थिति प्रमाणपत्र'),
        O('Certificate of qualification', 'Certificate of qualification', 'شهادة تأهيل', 'اہلیت سرٹیفکیٹ', 'योग्यता प्रमाणपत्र')] }
    ] },
    { id: 's7', t: L('Anything else?', 'ملاحظات إضافية', 'مزید کچھ؟', 'और कुछ?'), f: [
      { k: 'notes', type: 'textarea', l: L('Notes for the Academy team', 'ملاحظات لفريق الأكاديمية', 'اکیڈمی ٹیم کے لیے نوٹس', 'अकादमी टीम के लिए टिप्पणियाँ') }
    ] }
  ];
  const UI = {
    formT: L('Training requirement form', 'نموذج متطلبات التدريب', 'تربیتی ضروریات کا فارم', 'प्रशिक्षण आवश्यकता फ़ॉर्म'),
    formS: L('Tell us about your team and goals. Our Academy coordinator will reply within two working days with a recommended program and quotation.',
      'أخبرنا عن فريقك وأهدافك. سيرد منسق الأكاديمية خلال يومي عمل بالبرنامج المقترح وعرض السعر.',
      'اپنی ٹیم اور اہداف کے بارے میں بتائیں۔ اکیڈمی کوآرڈینیٹر دو کاروباری دنوں میں تجویز کردہ پروگرام اور قیمت کے ساتھ جواب دے گا۔',
      'अपनी टीम और लक्ष्यों के बारे में बताएँ। अकादमी समन्वयक दो कार्य दिवसों में सुझाए गए कार्यक्रम और कोटेशन के साथ उत्तर देगा।'),
    section: L('Section', 'القسم', 'حصہ', 'खंड'),
    required: L('Required', 'مطلوب', 'ضروری', 'आवश्यक'),
    other: L('Other', 'أخرى', 'دیگر', 'अन्य'),
    otherPh: L('Please specify', 'يرجى التحديد', 'براہِ کرم وضاحت کریں', 'कृपया बताएँ'),
    yes: L('Yes', 'نعم', 'ہاں', 'हाँ'), no: L('No', 'لا', 'نہیں', 'नहीं'),
    send: L('Send request', 'إرسال الطلب', 'درخواست بھیجیں', 'अनुरोध भेजें'),
    sending: L('Sending…', 'جارٍ الإرسال…', 'بھیجا جا رہا ہے…', 'भेजा जा रहा है…'),
    fix: L('Please complete the highlighted fields.', 'يرجى إكمال الحقول المحددة.', 'براہِ کرم نمایاں خانے مکمل کریں۔', 'कृपया चिह्नित फ़ील्ड पूरे करें।'),
    netErr: L('Could not send. Check your connection and try again, or email j.alnajar@inovex-group.com.', 'تعذر الإرسال. تحقق من الاتصال وأعد المحاولة، أو راسل j.alnajar@inovex-group.com.', 'بھیجا نہیں جا سکا۔ کنکشن چیک کریں یا j.alnajar@inovex-group.com پر ای میل کریں۔', 'भेजा नहीं जा सका। कनेक्शन जाँचें या j.alnajar@inovex-group.com पर ईमेल करें।'),
    doneT: L('Thank you — request received', 'شكراً — تم استلام طلبك', 'شکریہ — درخواست موصول ہو گئی', 'धन्यवाद — अनुरोध प्राप्त हुआ'),
    doneD: L('We sent a copy to your email. Our Academy coordinator will contact you within two working days.', 'أرسلنا نسخة إلى بريدك. سيتواصل معك منسق الأكاديمية خلال يومي عمل.', 'ہم نے ایک کاپی آپ کی ای میل پر بھیج دی ہے۔ اکیڈمی کوآرڈینیٹر دو کاروباری دنوں میں رابطہ کرے گا۔', 'हमने एक प्रति आपके ईमेल पर भेज दी है। अकादमी समन्वयक दो कार्य दिवसों में संपर्क करेगा।'),
    ref: L('Reference', 'الرقم المرجعي', 'حوالہ نمبر', 'संदर्भ संख्या'),
    dl: L('Download a PDF copy', 'تنزيل نسخة PDF', 'PDF کاپی ڈاؤن لوڈ کریں', 'PDF प्रति डाउनलोड करें'),
    home: L('Back to the Academy', 'العودة إلى الأكاديمية', 'اکیڈمی پر واپس', 'अकादमी पर वापस'),
    privacy: L('Your details are used only to prepare your training proposal.', 'تُستخدم بياناتك فقط لإعداد عرض التدريب.', 'آپ کی معلومات صرف تربیتی تجویز کے لیے استعمال ہوں گی۔', 'आपकी जानकारी केवल प्रशिक्षण प्रस्ताव तैयार करने के लिए उपयोग होगी।')
  };

  const ESC = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------------------------------------------------------- landing page */
  function landing(h) {
    const g = o => (o && (o[h.lang()] || o.en)) || '';
    const signedIn = h.signedIn();
    const vids = (window.ACADEMY_VIDEOS || []).filter(v => v && (v.youtube || v.src));
    const videoTiles = vids.length ? vids.map(v => `<figure class="vid">${v.youtube
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${ESC(v.youtube)}?rel=0" title="${ESC(g(v.title))}" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : `<video src="${ESC(v.src)}" ${v.poster ? `poster="${ESC(v.poster)}"` : ''} controls preload="none" playsinline></video>`}<figcaption>${ESC(g(v.title))}</figcaption></figure>`).join('')
      : [1, 2, 3].map(i => `<figure class="vid soon"><div><span>▶</span>${g(P.soon)}</div><figcaption>&nbsp;</figcaption></figure>`).join('');
    const once = P.ticker.map(x => `<span>${ESC(g(x))}</span><i aria-hidden="true">◆</i>`).join('');
    const tick = once + once;   // each half must be wider than the widest screen for a seamless loop
    h.view(`
      <div class="lp-ticker" role="marquee" aria-label="${ESC(P.ticker.map(g).join(' · '))}"><div class="lp-ticker-track"><div>${tick}</div><div aria-hidden="true">${tick}</div></div></div>
      <section class="lp-hero">
        <div class="lp-hero-in">
          <div class="lp-copy">
            <div class="lp-eyebrow">${g(P.eyebrow)}</div>
            <h1>${g(P.h1)}</h1>
            <p>${g(P.sub)}</p>
            <div class="lp-cta"><a class="btn gold" href="#/request">${g(P.ctaRequest)}</a>
              ${signedIn ? `<a class="btn line" href="#/home">${g(P.ctaMine)}</a>` : `<a class="btn line" href="#/login">${g(P.ctaSignin)}</a>`}</div>
            <div class="lp-motto">${g(P.motto)}</div>
          </div>
          <aside class="lp-partners">
            <a class="plogo" href="https://www.inovex-group.com/" target="_blank" rel="noopener" title="INOVEX Group"><img src="/img/inovex.png" alt="INOVEX Group"></a>
            <div class="lp-p"><span>${g(P.inAssoc)}</span><a class="plogo" href="https://alqimahtraining.com/" target="_blank" rel="noopener" title="${esc(g(P.qemName))}"><img src="/img/alqemma.png" alt="${esc(g(P.qemName))}"></a></div>
            <div class="lp-p"><span>${g(P.authorisedBy)}</span><a class="plogo" href="https://www.wagner-group.com/en/" target="_blank" rel="noopener" title="WAGNER Group"><img src="/img/wagner.jpg" alt="WAGNER Group"></a></div>
          </aside>
        </div>
      </section>
      <section class="lp-stats">
        <div><b>14+</b><span>${g(P.s1)}</span></div><div><b>3</b><span>${g(P.s2)}</span></div>
        <div><b>4</b><span>${g(P.s3)}</span></div><div><b>3,500+</b><span>${g(P.s4)}</span></div>
      </section>
      <section class="lp-sec"><h2>${g(P.fieldsT)}</h2><p class="lp-lead">${g(P.fieldsS)}</p>
        <div class="lp-fields">${FIELDS.map(f => `<div><i>${f[1]}</i>${g(f[2])}</div>`).join('')}</div></section>
      <section class="lp-sec"><h2>${g(P.levelsT)}</h2>
        <div class="lp-levels">
          <article><div class="lv">01</div><h3>${g(P.basic)}</h3><p>${g(P.basicD)}</p></article>
          <article class="hl"><div class="lv">02</div><h3>${g(P.pro)}</h3><p>${g(P.proD)}</p></article>
          <article><div class="lv">03</div><h3>${g(P.cust)}</h3><p>${g(P.custD)}</p></article>
        </div><p class="lp-note">${g(P.minNote)} · ${g(P.formats)}</p></section>
      <section class="lp-sec lp-how"><h2>${g(P.howT)}</h2>
        <ol>${[[P.h1t, P.h1d], [P.h2t, P.h2d], [P.h3t, P.h3d], [P.h4t, P.h4d]].map((s, i) => `<li><span>${i + 1}</span><b>${g(s[0])}</b><p>${g(s[1])}</p></li>`).join('')}</ol></section>
      <section class="lp-sec"><h2>${g(P.videosT)}</h2><div class="lp-videos">${videoTiles}</div></section>
      <section class="lp-sec"><h2>${g(P.onlineT)}</h2><p class="lp-lead">${g(P.onlineS)}</p>
        <div class="lp-courses">
          <a class="lp-course" href="${signedIn ? '#/c/PC-101' : '#/signup'}"><span class="code">PC-101</span><b>${g(P.pc101)}</b><small>${g(P.pc101d)}</small><span class="go">${signedIn ? g(P.ctaMine) : g(P.haveCode)} →</span></a>
          <div class="lp-course muted"><span class="code">2027</span><b>${g(P.more)}</b><small>${g(P.moreD)}</small></div>
        </div></section>
      <section class="lp-sec"><h2>${g(P.partnersT)}</h2>
        <div class="lp-plist">
          <article><a class="plogo" href="https://alqimahtraining.com/" target="_blank" rel="noopener" title="${esc(g(P.qemName))}"><img src="/img/alqemma.png" alt="${esc(g(P.qemName))}"></a><div><h3><a href="https://alqimahtraining.com/" target="_blank" rel="noopener">${g(P.qemName)}</a></h3><p>${g(P.qemD)}</p></div></article>
          <article><a class="plogo" href="https://www.wagner-group.com/en/" target="_blank" rel="noopener" title="WAGNER Group"><img src="/img/wagner.jpg" alt="WAGNER Group"></a><div><h3><a href="https://www.wagner-group.com/en/" target="_blank" rel="noopener">${g(P.wagName)}</a></h3><p>${g(P.wagD)}</p></div></article>
        </div></section>
      <section class="lp-sec lp-faq"><h2>${g(P.faqT)}</h2>${FAQ.map((f, i) => `<details ${i === 0 ? 'open' : ''}><summary>${g(f[0])}</summary><p>${g(f[1])}</p></details>`).join('')}</section>
      <section class="lp-band"><div><h2>${g(P.bandT)}</h2><p>${g(P.bandD)}</p></div>
        <div class="lp-band-cta"><a class="btn gold" href="#/request">${g(P.ctaRequest)}</a>
        <div class="lp-contact"><a class="btn wa" href="https://wa.me/966509620944" target="_blank" rel="noopener">WhatsApp</a><a class="btn callb" href="tel:+966509620944">${g(P.call)} <span class="mono">+966 50 962 0944</span></a></div>
        <a class="lp-mail mono" href="mailto:j.alnajar@inovex-group.com">j.alnajar@inovex-group.com</a></div></section>`);
  }

  /* ---------------------------------------------------------------- request form */
  function request(h) {
    const lang = h.lang(), g = o => (o && (o[lang] || o.en)) || '';
    const fieldHtml = f => {
      const id = 'rq_' + f.k, star = f.req ? ' <em title="' + g(UI.required) + '">*</em>' : '';
      if (['text', 'tel', 'email', 'number'].indexOf(f.type) >= 0)
        return `<label class="field rq-f" data-k="${f.k}"><span>${g(f.l)}${star}</span><input id="${id}" name="${f.k}" type="${f.type}" ${f.type === 'number' ? 'min="1" inputmode="numeric"' : ''} ${f.type === 'email' || f.type === 'tel' ? 'dir="ltr"' : ''} ${f.req ? 'required' : ''} maxlength="200"></label>`;
      if (f.type === 'textarea') return `<label class="field rq-f wide" data-k="${f.k}"><span>${g(f.l)}</span><textarea name="${f.k}" rows="4" maxlength="2000"></textarea></label>`;
      if (f.type === 'yesno') return `<div class="rq-f wide" data-k="${f.k}"><span class="rq-l">${g(f.l)}</span><div class="chips">
          <label class="chip"><input type="radio" name="${f.k}" value="Yes"><span>${g(UI.yes)}</span></label><label class="chip"><input type="radio" name="${f.k}" value="No"><span>${g(UI.no)}</span></label></div>
          <input class="rq-detail" name="${f.k}_detail" placeholder="${g(f.detail)}" maxlength="500"></div>`;
      const multi = f.type === 'multi';
      return `<div class="rq-f wide" data-k="${f.k}"><span class="rq-l">${g(f.l)}${star}</span><div class="chips">` +
        f.o.map(o => `<label class="chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${f.k}" value="${ESC(o.k)}"><span>${g(o.l)}</span></label>`).join('') +
        (f.other ? `<label class="chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${f.k}" value="Other" data-other="1"><span>${g(UI.other)}</span></label>` : '') +
        `</div>${f.other ? `<input class="rq-detail" name="${f.k}_other" placeholder="${g(UI.otherPh)}" maxlength="300">` : ''}</div>`;
    };
    h.view(`<div class="rq"><div class="crumbs"><a href="#/">${h.t('academy')}</a> / ${g(UI.formT)}</div>
      <div class="rq-head"><div><h1>${g(UI.formT)}</h1><p>${g(UI.formS)}</p></div>
        <div class="rq-logos"><img src="/img/wagner.jpg" alt="WAGNER" class="wag"><img src="/img/alqemma.png" alt="Al Qemma"></div></div>
      <form id="rqf" novalidate>
        <input type="text" name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
        ${FORM.map((s, i) => `<fieldset class="rq-sec"><legend><span>${g(UI.section)} ${i + 1}</span>${g(s.t)}</legend><div class="rq-grid">${s.f.map(fieldHtml).join('')}</div></fieldset>`).join('')}
        <div id="rqmsg"></div>
        <div class="rq-send"><button class="btn gold" id="rqb">${g(UI.send)}</button><span class="hint">${g(UI.privacy)}</span></div>
      </form></div>`);
    const form = document.getElementById('rqf');
    form.addEventListener('change', e => { const f = e.target.closest('.rq-f'); if (f) f.classList.remove('bad'); });
    form.onsubmit = async e => {
      e.preventDefault();
      if (form.website.value) return;
      const data = collect(form);
      const bad = validate(form, data);
      const msg = document.getElementById('rqmsg');
      if (bad) { msg.innerHTML = `<div class="msg err">${g(UI.fix)}</div>`; bad.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const b = document.getElementById('rqb'); b.disabled = true; b.textContent = g(UI.sending); msg.innerHTML = '';
      try {
        const sheet = pdfSheet(data, null);
        const pdf = await makePdf(sheet);
        const r = await h.api('apply', { lang: lang, company: data.company, contact: data.contact, email: data.email, phone: data.phone, answers: data.rows, pdf: { data: pdf.base64 }, website: '' });
        done(h, data, r.ref);
      } catch (err) {
        b.disabled = false; b.textContent = g(UI.send);
        msg.innerHTML = `<div class="msg err">${err && err.message && err.message !== 'network' && I18N.en['e_' + err.message] ? h.t('e_' + err.message) : g(UI.netErr)}</div>`;
      }
    };
  }
  function collect(form) {
    const fd = new FormData(form), out = { rows: [] };
    FORM.forEach(s => s.f.forEach(f => {
      let v;
      if (f.type === 'multi' || f.type === 'single') {
        v = fd.getAll(f.k).map(x => x === 'Other' ? 'Other: ' + (fd.get(f.k + '_other') || '').trim() : x);
        v = v.join(', ');
      } else if (f.type === 'yesno') {
        v = fd.get(f.k) || ''; const d = (fd.get(f.k + '_detail') || '').trim(); if (d) v += (v ? ' — ' : '') + d;
      } else v = String(fd.get(f.k) || '').trim();
      out[f.k] = v;
      out.rows.push({ section: s.t.en, sectionAr: s.t.ar, label: f.l.en, labelAr: f.l.ar, value: v });
    }));
    return out;
  }
  function validate(form, d) {
    let first = null;
    FORM.forEach(s => s.f.forEach(f => {
      let ok = true;
      if (f.req && !d[f.k]) ok = false;
      if (f.k === 'email' && d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) ok = false;
      if (f.k === 'trainees' && d.trainees && !(Number(d.trainees) >= 1)) ok = false;
      const el = form.querySelector(`.rq-f[data-k="${f.k}"]`);
      if (el) el.classList.toggle('bad', !ok);
      if (!ok && !first) first = el;
    }));
    return first;
  }
  /* bilingual (English | Arabic) sheet that becomes the PDF sent to the Academy */
  function pdfSheet(d, ref) {
    let last = '', rows = '';
    d.rows.forEach(r => {
      if (r.section !== last) { rows += `<tr class="sh"><td colspan="3"><span>${ESC(r.section)}</span><span dir="rtl">${ESC(r.sectionAr)}</span></td></tr>`; last = r.section; }
      rows += `<tr><td class="le">${ESC(r.label)}</td><td class="v" dir="auto">${ESC(r.value || '—')}</td><td class="la" dir="rtl">${ESC(r.labelAr)}</td></tr>`;
    });
    const when = new Date();
    return `<div class="rqpdf" id="rqpdf"><div class="rtop"><img src="/img/inovex.png" alt=""><div class="tt"><b>INOVEX ACADEMY</b><span>Industrial Training · التدريب الصناعي</span></div>
      <div class="pl"><img src="/img/wagner.jpg" alt=""><img src="/img/alqemma.png" alt=""></div></div>
      <h1>Training Requirement Form <span dir="rtl">نموذج متطلبات التدريب</span></h1>
      <div class="meta">${ref ? 'Ref ' + ESC(ref) + ' · ' : ''}${when.toISOString().slice(0, 16).replace('T', ' ')} · academy.inovex-group.com</div>
      <table>${rows}</table><div class="foot">INOVEX GROUP | TRAINING TODAY … DRIVING TOMORROW</div></div>`;
  }
  async function makePdf(html) {
    const off = document.getElementById('offscreen');
    off.innerHTML = `<div class="rqpdf-wrap">${html}</div>`;
    try {
      await document.fonts.ready;
      await Promise.all([...off.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      const node = off.querySelector('.rqpdf');
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const pdf = new jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      const pw = 210, ph = 297, k = canvas.width / pw, pageH = Math.floor(ph * k);
      for (let y = 0, p = 0; y < canvas.height; y += pageH, p++) {
        const hgt = Math.min(pageH, canvas.height - y), c = document.createElement('canvas');
        c.width = canvas.width; c.height = hgt; c.getContext('2d').drawImage(canvas, 0, y, canvas.width, hgt, 0, 0, canvas.width, hgt);
        if (p) pdf.addPage();
        pdf.addImage(c.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, pw, hgt / k);
      }
      return { pdf: pdf, base64: pdf.output('datauristring').split(',')[1] };
    } finally { off.innerHTML = ''; }
  }
  function done(h, d, ref) {
    const g = o => (o && (o[h.lang()] || o.en)) || '';
    h.view(`<div class="card auth" style="max-width:560px;text-align:center"><div class="donecheck">✓</div><h2>${g(UI.doneT)}</h2><p>${g(UI.doneD)}</p>
      <p>${g(UI.ref)}: <b class="mono">${ESC(ref)}</b></p>
      <div class="actions" style="justify-content:center"><button class="btn dark" id="rqdl">${g(UI.dl)}</button><a class="btn ghost" href="#/">${g(UI.home)}</a></div></div>`);
    document.getElementById('rqdl').onclick = async e => {
      e.target.disabled = true;
      const r = await makePdf(pdfSheet(d, ref));
      r.pdf.save(`INOVEX_Academy_Training_Request_${ref}.pdf`);
      e.target.disabled = false;
    };
  }

  window.IA_PUBLIC = { landing: landing, request: request, FAQ: FAQ, FIELDS: FIELDS, P: P };
})();
