export const NANCY_BLESSING_BATCH_KEY = 'nancy_world_welcome_2026';
export const NANCY_TEAM_MESSAGE_TYPE = 'TEAM_BLESSING';

export type NancyTeamBlessing = {
  teamName: string;
  teamCode: string;
  countryCode: string;
  flagUrl: string;
  message: string;
};

export const NANCY_TEAM_BLESSINGS: NancyTeamBlessing[] = [
  { teamName: '墨西哥', teamCode: 'MEX', countryCode: 'MX', flagUrl: '/static/flags/MX.svg', message: '🇲🇽 Bienvenida al mundo, Nancy. Que tu vida esté llena de alegría, música y goles hermosos.' },
  { teamName: '南非', teamCode: 'RSA', countryCode: 'ZA', flagUrl: '/static/flags/ZA.svg', message: '🇿🇦 Welcome to the world, Nancy. May your days shine as brightly as the rainbow nation.' },
  { teamName: '韩国', teamCode: 'KOR', countryCode: 'KR', flagUrl: '/static/flags/KR.svg', message: '🇰🇷 Nancy야, 세상에 온 걸 환영해. 건강하고 행복하게 자라길 바랄게.' },
  { teamName: '捷克', teamCode: 'CZE', countryCode: 'CZ', flagUrl: '/static/flags/CZ.svg', message: '🇨🇿 Vítej na světě, Nancy. Ať tě provází zdraví, štěstí a spousta úsměvů.' },
  { teamName: '加拿大', teamCode: 'CAN', countryCode: 'CA', flagUrl: '/static/flags/CA.svg', message: '🇨🇦 Welcome, Nancy. May your life be as warm, bright, and beautiful as a maple sunrise.' },
  { teamName: '波黑', teamCode: 'BIH', countryCode: 'BA', flagUrl: '/static/flags/BA.svg', message: '🇧🇦 Dobrodošla, Nancy. Neka ti život bude ispunjen ljubavlju, mirom i srećom.' },
  { teamName: '卡塔尔', teamCode: 'QAT', countryCode: 'QA', flagUrl: '/static/flags/QA.svg', message: '🇶🇦 أهلاً بكِ يا Nancy في هذا العالم. نتمنى لكِ حياة مليئة بالنور والفرح.' },
  { teamName: '瑞士', teamCode: 'SUI', countryCode: 'CH', flagUrl: '/static/flags/CH.svg', message: '🇨🇭 Willkommen, Nancy. Möge dein Leben ruhig, hell und voller Liebe sein.' },
  { teamName: '巴西', teamCode: 'BRA', countryCode: 'BR', flagUrl: '/static/flags/BR.svg', message: '🇧🇷 Bem-vinda ao mundo, Nancy. Que sua vida tenha alegria, samba e muitos sonhos coloridos.' },
  { teamName: '摩洛哥', teamCode: 'MAR', countryCode: 'MA', flagUrl: '/static/flags/MA.svg', message: '🇲🇦 مرحباً Nancy. نتمنى لكِ عمراً جميلاً مليئاً بالحب والبركة.' },
  { teamName: '海地', teamCode: 'HTI', countryCode: 'HT', flagUrl: '/static/flags/HT.svg', message: '🇭🇹 Byenvini, Nancy. May your little heart grow strong, kind, and full of sunshine.' },
  { teamName: '苏格兰', teamCode: 'SCO', countryCode: 'GB-SCT', flagUrl: '/static/flags/GB-SCT.svg', message: '🏴 Welcome wee Nancy. May your life be brave, bright, and full of songs.' },
  { teamName: '美国', teamCode: 'USA', countryCode: 'US', flagUrl: '/static/flags/US.svg', message: '🇺🇸 Welcome to the world, Nancy. Dream big, smile often, and shine every day.' },
  { teamName: '巴拉圭', teamCode: 'PAR', countryCode: 'PY', flagUrl: '/static/flags/PY.svg', message: '🇵🇾 Bienvenida, Nancy. Que crezcas rodeada de cariño, esperanza y dulces abrazos.' },
  { teamName: '澳大利亚', teamCode: 'AUS', countryCode: 'AU', flagUrl: '/static/flags/AU.svg', message: '🇦🇺 G’day, Nancy. May your life be sunny, adventurous, and full of kindness.' },
  { teamName: '土耳其', teamCode: 'TUR', countryCode: 'TR', flagUrl: '/static/flags/TR.svg', message: '🇹🇷 Hoş geldin Nancy. Hayatın sevgi, sağlık ve güzel mucizelerle dolu olsun.' },
  { teamName: '德国', teamCode: 'GER', countryCode: 'DE', flagUrl: '/static/flags/DE.svg', message: '🇩🇪 Willkommen auf der Welt, Nancy. Mögest du gesund, mutig und glücklich aufwachsen.' },
  { teamName: '库拉索', teamCode: 'CUW', countryCode: 'CW', flagUrl: '/static/flags/CW.svg', message: '🇨🇼 Bon bini, Nancy. May your days be colorful, joyful, and full of island sunshine.' },
  { teamName: '科特迪瓦', teamCode: 'CIV', countryCode: 'CI', flagUrl: '/static/flags/CI.svg', message: '🇨🇮 Bienvenue, Nancy. Que ta vie soit remplie de sourires, de force et de douceur.' },
  { teamName: '厄瓜多尔', teamCode: 'ECU', countryCode: 'EC', flagUrl: '/static/flags/EC.svg', message: '🇪🇨 Bienvenida, Nancy. Que cada amanecer te traiga amor, salud y alegría.' },
  { teamName: '荷兰', teamCode: 'NED', countryCode: 'NL', flagUrl: '/static/flags/NL.svg', message: '🇳🇱 Welkom, Nancy. Moge je leven bloeien als tulpen in de lente.' },
  { teamName: '日本', teamCode: 'JPN', countryCode: 'JP', flagUrl: '/static/flags/JP.svg', message: '🇯🇵 Nancyちゃん、世界へようこそ。健やかで、笑顔いっぱいの日々になりますように。' },
  { teamName: '瑞典', teamCode: 'SWE', countryCode: 'SE', flagUrl: '/static/flags/SE.svg', message: '🇸🇪 Välkommen, Nancy. Må ditt liv fyllas av ljus, värme och många glada stunder.' },
  { teamName: '突尼斯', teamCode: 'TUN', countryCode: 'TN', flagUrl: '/static/flags/TN.svg', message: '🇹🇳 أهلاً Nancy. نتمنى لكِ طفولة سعيدة وقلباً مليئاً بالأمل.' },
  { teamName: '比利时', teamCode: 'BEL', countryCode: 'BE', flagUrl: '/static/flags/BE.svg', message: '🇧🇪 Bienvenue, Nancy. Que ta vie soit douce comme le chocolat et brillante comme un sourire.' },
  { teamName: '埃及', teamCode: 'EGY', countryCode: 'EG', flagUrl: '/static/flags/EG.svg', message: '🇪🇬 أهلاً بكِ Nancy. ليكن مستقبلكِ مشرقاً كالشمس فوق النيل.' },
  { teamName: '伊朗', teamCode: 'IRI', countryCode: 'IR', flagUrl: '/static/flags/IR.svg', message: '🇮🇷 خوش آمدی Nancy. برایت زندگی‌ای پر از سلامتی، عشق و آرامش آرزو می‌کنیم.' },
  { teamName: '新西兰', teamCode: 'NZL', countryCode: 'NZ', flagUrl: '/static/flags/NZ.svg', message: '🇳🇿 Kia ora, Nancy. May your journey be peaceful, strong, and full of wonder.' },
  { teamName: '西班牙', teamCode: 'ESP', countryCode: 'ES', flagUrl: '/static/flags/ES.svg', message: '🇪🇸 Bienvenida al mundo, Nancy. Que tu vida tenga luz, familia y mucha felicidad.' },
  { teamName: '佛得角', teamCode: 'CPV', countryCode: 'CV', flagUrl: '/static/flags/CV.svg', message: '🇨🇻 Bem-vinda, Nancy. Que a tua vida navegue sempre com amor, alegria e esperança.' },
  { teamName: '沙特阿拉伯', teamCode: 'KSA', countryCode: 'SA', flagUrl: '/static/flags/SA.svg', message: '🇸🇦 أهلاً Nancy. نسأل الله أن يملأ أيامكِ بالخير والفرح والصحة.' },
  { teamName: '乌拉圭', teamCode: 'URU', countryCode: 'UY', flagUrl: '/static/flags/UY.svg', message: '🇺🇾 Bienvenida, Nancy. Que tengas una vida tranquila, feliz y llena de abrazos.' },
  { teamName: '法国', teamCode: 'FRA', countryCode: 'FR', flagUrl: '/static/flags/FR.svg', message: '🇫🇷 Bienvenue au monde, Nancy. Que ta vie soit pleine d’amour, de beauté et de rêves.' },
  { teamName: '塞内加尔', teamCode: 'SEN', countryCode: 'SN', flagUrl: '/static/flags/SN.svg', message: '🇸🇳 Bienvenue, Nancy. Que ton cœur grandisse avec courage, joie et lumière.' },
  { teamName: '伊拉克', teamCode: 'IRQ', countryCode: 'IQ', flagUrl: '/static/flags/IQ.svg', message: '🇮🇶 أهلاً Nancy. نتمنى لكِ عمراً مباركاً مليئاً بالسلام والمحبة.' },
  { teamName: '挪威', teamCode: 'NOR', countryCode: 'NO', flagUrl: '/static/flags/NO.svg', message: '🇳🇴 Velkommen, Nancy. Må livet ditt bli fylt med ro, styrke og vakre eventyr.' },
  { teamName: '阿根廷', teamCode: 'ARG', countryCode: 'AR', flagUrl: '/static/flags/AR.svg', message: '🇦🇷 Bienvenida, Nancy. Que tu vida tenga pasión, ternura y muchos sueños cumplidos.' },
  { teamName: '阿尔及利亚', teamCode: 'DZA', countryCode: 'DZ', flagUrl: '/static/flags/DZ.svg', message: '🇩🇿 مرحباً Nancy. نتمنى لكِ حياة جميلة مليئة بالحب والبركة.' },
  { teamName: '奥地利', teamCode: 'AUT', countryCode: 'AT', flagUrl: '/static/flags/AT.svg', message: '🇦🇹 Willkommen, Nancy. Möge dein Leben klingen wie eine schöne Melodie.' },
  { teamName: '约旦', teamCode: 'JOR', countryCode: 'JO', flagUrl: '/static/flags/JO.svg', message: '🇯🇴 أهلاً بكِ Nancy. ليكن طريقكِ مليئاً بالحب والطمأنينة والفرح.' },
  { teamName: '葡萄牙', teamCode: 'POR', countryCode: 'PT', flagUrl: '/static/flags/PT.svg', message: '🇵🇹 Bem-vinda ao mundo, Nancy. Que a tua vida seja cheia de amor, saúde e alegria.' },
  { teamName: '刚果民主共和国', teamCode: 'COD', countryCode: 'CD', flagUrl: '/static/flags/CD.svg', message: '🇨🇩 Bienvenue, Nancy. Que ta vie soit forte, lumineuse et entourée de bienveillance.' },
  { teamName: '乌兹别克斯坦', teamCode: 'UZB', countryCode: 'UZ', flagUrl: '/static/flags/UZ.svg', message: '🇺🇿 Xush kelibsan, Nancy. Hayoting mehr, salomatlik va baxtga to‘la bo‘lsin.' },
  { teamName: '哥伦比亚', teamCode: 'COL', countryCode: 'CO', flagUrl: '/static/flags/CO.svg', message: '🇨🇴 Bienvenida, Nancy. Que tu vida baile con alegría, amor y esperanza.' },
  { teamName: '英格兰', teamCode: 'ENG', countryCode: 'GB-ENG', flagUrl: '/static/flags/GB-ENG.svg', message: '🏴 Welcome to the world, Nancy. May your days be brave, kind, and full of wonder.' },
  { teamName: '克罗地亚', teamCode: 'CRO', countryCode: 'HR', flagUrl: '/static/flags/HR.svg', message: '🇭🇷 Dobrodošla, Nancy. Neka tvoj život bude ispunjen ljubavlju, zdravljem i srećom.' },
  { teamName: '加纳', teamCode: 'GHA', countryCode: 'GH', flagUrl: '/static/flags/GH.svg', message: '🇬🇭 Akwaaba, Nancy. May your life be golden, joyful, and full of blessings.' },
  { teamName: '巴拿马', teamCode: 'PAN', countryCode: 'PA', flagUrl: '/static/flags/PA.svg', message: '🇵🇦 Bienvenida, Nancy. Que crezcas con alegría, salud y una familia llena de amor.' },
];
