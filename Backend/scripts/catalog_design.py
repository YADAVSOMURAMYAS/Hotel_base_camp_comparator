"""Plain-data design for the Phase B catalogs (T15). Read only by design_helper.py.

Everything the generator needs that is not a travel time: names, districts, costs, types,
default importances and map positions. Positions are presentation data: they were placed by a
fixed rule (see verification/CATALOG_DESIGN_NOTES.md) and never feed the matrix.

Hotels are (id, name, stay_cost, district_id, x, y).
Places are (id, name, type, default_importance, district_id, x, y).
"""

MAP = {"width": 1000, "height": 600}

# ---- Surmapur: the 20 hotels and 35 places appended after the Demo trip ------------------------
SURMAPUR_DISTRICT_ORDER = ["FORT", "BAZAAR", "GHAT", "CIVIL", "LAKE"]

# Rows = hotel district, columns = place district (SURMAPUR_DISTRICT_ORDER). The Demo design.
SURMAPUR_BASE = [
    [30, 50, 70, 100, 120],
    [50, 25, 55, 55, 80],
    [70, 55, 30, 100, 120],
    [88, 45, 85, 25, 60],
    [120, 80, 120, 70, 30],
]

# Hand-authored Demo offsets (verification/DEMO_DESIGN_NOTES.md), in Demo file order.
SURMAPUR_DEMO_HOTEL_OFFSETS = [2, 6, 8, -6, 5, -5, 2, -5, 3, -7]
SURMAPUR_DEMO_PLACE_OFFSETS = [6, -5, -1, 0, -5, -6, 5, 2, 2, -2, 2, -5, 6, 7, 7]


SURMAPUR_NEW_HOTELS = [  # 20 hotels, file indexes 10..29
    ("H_RAMPART", "Rampart Retreat", 41200, "FORT", 40, 40),
    ("H_KILA", "Kila Courtyard Stay", 22600, "FORT", 160, 40),
    ("H_JHAROKHA", "Jharokha Heritage Suites", 47500, "FORT", 360, 40),
    ("H_SENTRY", "Sentry Gate Guesthouse", 9800, "FORT", 140, 100),
    ("H_SPICE", "Spice Lane Lodge", 18400, "BAZAAR", 430, 150),
    ("H_CHOWK", "Chowk Central Hotel", 34200, "BAZAAR", 550, 150),
    ("H_ZARI", "Zari Bazaar Inn", 14900, "BAZAAR", 670, 150),
    ("H_MINAR", "Minar View Residency", 43900, "BAZAAR", 430, 210),
    ("H_BOATMAN", "Boatman's Rest", 11300, "GHAT", 40, 300),
    ("H_DIYA", "Diya Ghat Boutique", 38600, "GHAT", 160, 300),
    ("H_SANGAM", "Sangam Riverside", 26700, "GHAT", 280, 300),
    ("H_LOTUS", "Lotus Steps Hotel", 21500, "GHAT", 380, 340),
    ("H_RAJ", "Raj Club Residency", 55400, "CIVIL", 800, 30),
    ("H_ELM", "Elm Avenue Hotel", 28900, "CIVIL", 840, 70),
    ("H_PARADE", "Parade Ground Inn", 13700, "CIVIL", 800, 130),
    ("H_GULMOHAR", "Gulmohar Grand", 31800, "CIVIL", 840, 170),
    ("H_JETTY", "Lakeside Jetty Cottages", 24800, "LAKE", 620, 360),
    ("H_PINE", "Pinecrest Lake Lodge", 17200, "LAKE", 880, 360),
    ("H_SUNSET", "Sunset Terrace Resort", 46300, "LAKE", 560, 400),
    ("H_MISTY", "Misty Shore Homestay", 10900, "LAKE", 720, 420),
]

SURMAPUR_NEW_PLACES = [  # 35 places, file indexes 15..49
    ("DARBAR", "Diwan-e-Khas Darbar Hall", "attraction", 4, "FORT", 100, 40),
    ("CANNON", "Jai Cannon Terrace", "attraction", 2, "FORT", 300, 40),
    ("ARMORY", "Royal Armory Gallery", "attraction", 3, "FORT", 420, 40),
    ("CHHATRI", "Sandstone Chhatri Gardens", "attraction", 2, "FORT", 280, 100),
    ("KEBAB", "Seekh Kebab Lane", "food", 3, "FORT", 200, 120),
    ("LASSI", "Fort Gate Lassi Stall", "food", 2, "FORT", 40, 140),
    ("BADAMHALWA", "Royal Badam Halwa", "food", 1, "FORT", 320, 140),
    ("SPICEMKT", "Spice Merchants' Row", "attraction", 4, "BAZAAR", 490, 150),
    ("BANGLE", "Bangle Lane", "attraction", 1, "BAZAAR", 610, 150),
    ("CHAAT", "Bhaiya Chaat Centre", "food", 5, "BAZAAR", 730, 150),
    ("SAMOSA", "Clocktower Samosa Wala", "food", 3, "BAZAAR", 590, 210),
    ("PAAN", "Rajwada Paan Shop", "food", 1, "BAZAAR", 710, 210),
    ("MITHAI", "Surmapur Mithai Mahal", "food", 4, "BAZAAR", 470, 250),
    ("AARTI", "Neelganga Aarti Steps", "attraction", 5, "GHAT", 100, 300),
    ("BOATRIDE", "Sunrise Boat Ride Landing", "attraction", 4, "GHAT", 220, 300),
    ("TEMPLE", "Shiv Ghat Temple", "attraction", 2, "GHAT", 340, 300),
    ("KITEFLY", "Kite Flyers' Bank", "attraction", 1, "GHAT", 40, 360),
    ("POHA", "Ghat-side Poha Cart", "food", 2, "GHAT", 100, 360),
    ("FISHFRY", "Neelganga Fish Fry", "food", 3, "GHAT", 160, 360),
    ("RABRI", "Riverstep Rabri Shop", "food", 4, "GHAT", 320, 360),
    ("CATHEDRAL", "St. Mark's Cathedral", "attraction", 2, "CIVIL", 960, 30),
    ("OBSERVE", "Colonial Observatory", "attraction", 3, "CIVIL", 960, 90),
    ("ARTGAL", "Civil Lines Art Gallery", "attraction", 3, "CIVIL", 960, 150),
    ("CAFE", "Old Post Office Cafe", "food", 3, "CIVIL", 940, 210),
    ("TANDOOR", "Tandoori Nights Grill", "food", 4, "CIVIL", 840, 230),
    ("DOSA", "Sagar Dosa Corner", "food", 2, "CIVIL", 940, 270),
    ("COFFEE", "Raj Club Coffee House", "food", 5, "CIVIL", 740, 290),
    ("BOATING", "Meghna Pedal Boats", "attraction", 3, "LAKE", 760, 360),
    ("BIRDS", "Meghna Bird Sanctuary", "attraction", 5, "LAKE", 940, 360),
    ("WATCHTWR", "Pine Hill Watchtower", "attraction", 4, "LAKE", 620, 420),
    ("SPA", "Lakeside Ayurveda Spa", "attraction", 1, "LAKE", 860, 420),
    ("BHUTTA", "Bhutta Roast Point", "food", 2, "LAKE", 920, 420),
    ("SIZZLER", "Lakeview Sizzler Deck", "food", 3, "LAKE", 560, 460),
    ("HILLCAFE", "Hilltop Bakery Cafe", "food", 4, "LAKE", 660, 460),
    ("PAKORA", "Monsoon Pakora Hut", "food", 1, "LAKE", 820, 460),
]

# ---- Shikharpur: a hill station with no Demo trip ----------------------------------------
SHIKHARPUR_DISTRICTS = [
    ("MALL", "The Mall Ridge"),
    ("GOMPA", "Gompa Hill"),
    ("TEA", "Chai Bagan Estates"),
    ("TAL", "Tal Lakefront"),
    ("CANTT", "Old Cantonment"),
    ("VALLEY", "Pine Valley"),
]

# Rows = hotel district, columns = place district (SHIKHARPUR_DISTRICTS order). Asymmetric.
SHIKHARPUR_BASE = [
    [20, 45, 60, 50, 35, 70],
    [50, 22, 90, 95, 65, 100],
    [60, 85, 25, 80, 75, 65],
    [50, 90, 80, 20, 55, 40],
    [35, 60, 75, 55, 22, 85],
    [70, 95, 65, 40, 80, 25],
]

SHIKHARPUR_HOTELS = [  # 30 hotels
    ("H_RIDGE", "Ridge View Grand", 58400, "MALL", 370, 40),
    ("H_PROMEN", "Promenade Palace", 72900, "MALL", 510, 40),
    ("H_BANDSTAND", "Bandstand Inn", 19600, "MALL", 405, 100),
    ("H_SNOWLINE", "Snowline Suites", 41500, "MALL", 545, 100),
    ("H_MALLROAD", "Mall Road Lodge", 12800, "MALL", 370, 160),
    ("H_MONK", "Monk's Rest Guesthouse", 7400, "GOMPA", 40, 40),
    ("H_PRAYER", "Prayer Flag Homestay", 9900, "GOMPA", 180, 40),
    ("H_GOMPA", "Gompa View Resort", 36700, "GOMPA", 75, 100),
    ("H_CHORTEN", "Chorten Heights", 24300, "GOMPA", 215, 100),
    ("H_BELL", "Bell Tower Retreat", 15200, "GOMPA", 40, 160),
    ("H_PLUCKER", "Tea Plucker's Cottage", 13500, "TEA", 40, 320),
    ("H_BAGAN", "Bagan Bungalow", 52100, "TEA", 180, 320),
    ("H_FLUSH", "First Flush Estate Stay", 66800, "TEA", 75, 380),
    ("H_TEAHOUSE", "Teahouse Lodge", 21400, "TEA", 215, 380),
    ("H_CLOUD", "Cloudrest Homestay", 10600, "TEA", 40, 440),
    ("H_TAL", "Tal Lakefront Hotel", 46200, "TAL", 370, 320),
    ("H_SHIKARA", "Shikara Landing Inn", 28700, "TAL", 510, 320),
    ("H_REEDS", "Reeds & Ripples", 17800, "TAL", 405, 380),
    ("H_BOATHSE", "Boathouse Hotel", 33900, "TAL", 545, 380),
    ("H_DUSK", "Dusk Terrace Resort", 79500, "TAL", 370, 440),
    ("H_COLONEL", "Colonel's Bungalow", 44800, "CANTT", 700, 40),
    ("H_PARADEG", "Parade Gate Inn", 11900, "CANTT", 840, 40),
    ("H_BARRACK", "Barracks Budget Stay", 6900, "CANTT", 735, 100),
    ("H_CHURCH", "Church Road Hotel", 23700, "CANTT", 875, 100),
    ("H_GOVHSE", "Governor's House Suites", 88000, "CANTT", 700, 160),
    ("H_PINEV", "Pine Valley Lodge", 20500, "VALLEY", 700, 320),
    ("H_ROPEWAY", "Ropeway Base Camp Inn", 14400, "VALLEY", 840, 320),
    ("H_CEDAR", "Cedar Cabins", 31200, "VALLEY", 735, 380),
    ("H_WATERFALL", "Waterfall View Resort", 57300, "VALLEY", 875, 380),
    ("H_TREK", "Trekkers' Hostel", 7900, "VALLEY", 700, 440),
]

SHIKHARPUR_PLACES = [  # 50 places
    ("RIDGEWALK", "Ridge Promenade Walk", "attraction", 4, "MALL", 440, 40),
    ("CHURCHSQ", "Christ Church Square", "attraction", 2, "MALL", 580, 40),
    ("LIBRARY", "Old Assembly Library", "attraction", 2, "MALL", 475, 100),
    ("TOYTRAIN", "Toy Train Station", "attraction", 5, "MALL", 615, 100),
    ("MOMO", "Mall Road Momo Stall", "food", 5, "MALL", 440, 160),
    ("BAKERY", "Ridge Bakery", "food", 3, "MALL", 510, 160),
    ("CHOCO", "Hot Chocolate Parlour", "food", 2, "MALL", 580, 160),
    ("THUKPA", "Thukpa Kitchen", "food", 4, "MALL", 405, 220),
    ("NOODLES", "Mall Road Noodle Point", "food", 3, "MALL", 475, 220),
    ("MONASTERY", "Thubten Gompa Monastery", "attraction", 5, "GOMPA", 110, 40),
    ("PRAYERWHL", "Prayer Wheel Corridor", "attraction", 3, "GOMPA", 250, 40),
    ("STUPA", "Peace Stupa", "attraction", 4, "GOMPA", 145, 100),
    ("MEDITATE", "Meditation Cave", "attraction", 1, "GOMPA", 285, 100),
    ("SUNRISE", "Eagle Hill Sunrise Point", "attraction", 4, "GOMPA", 110, 160),
    ("BUTTERTEA", "Butter Tea House", "food", 2, "GOMPA", 180, 160),
    ("TINGMO", "Tingmo Steamed Bread Cafe", "food", 1, "GOMPA", 250, 160),
    ("SHAPHALE", "Shaphale Corner", "food", 3, "GOMPA", 75, 220),
    ("TEAFACT", "Estate Tea Factory Tour", "attraction", 4, "TEA", 110, 320),
    ("PLUCKING", "Plucking Trail", "attraction", 3, "TEA", 250, 320),
    ("TEAGARDEN", "Terraced Tea Gardens", "attraction", 5, "TEA", 145, 380),
    ("PLANTERS", "Planter's Bungalow Museum", "attraction", 1, "TEA", 285, 380),
    ("TEASAMPLER", "First Flush Tasting Room", "food", 3, "TEA", 110, 440),
    ("SCONES", "Estate Scones Cafe", "food", 2, "TEA", 180, 440),
    ("ALOODUM", "Aloo Dum Dhaba", "food", 4, "TEA", 250, 440),
    ("BHAJIA", "Rainy-day Bhajia Shack", "food", 1, "TEA", 75, 500),
    ("LAKEWALK", "Tal Lakeside Walk", "attraction", 4, "TAL", 440, 320),
    ("SHIKARARIDE", "Shikara Ride", "attraction", 5, "TAL", 580, 320),
    ("BOATCLUB", "Old Boat Club", "attraction", 2, "TAL", 475, 380),
    ("FLOATMKT", "Floating Flower Market", "attraction", 3, "TAL", 615, 380),
    ("TROUT", "Grilled Trout Deck", "food", 4, "TAL", 440, 440),
    ("KAHWA", "Kahwa Kiosk", "food", 2, "TAL", 510, 440),
    ("RAJMA", "Rajma Chawal Counter", "food", 3, "TAL", 580, 440),
    ("CAKEHSE", "Lakeview Cake House", "food", 1, "TAL", 405, 500),
    ("FONDUE", "Cheese Fondue Terrace", "food", 5, "TAL", 475, 500),
    ("PARADE", "Parade Ground", "attraction", 1, "CANTT", 770, 40),
    ("WARMEM", "War Memorial", "attraction", 2, "CANTT", 910, 40),
    ("STJOHNS", "St. John's Chapel", "attraction", 3, "CANTT", 805, 100),
    ("CLUBHSE", "Heritage Club House", "attraction", 2, "CANTT", 945, 100),
    ("CUTLET", "Anglo Fish Cutlet House", "food", 4, "CANTT", 770, 160),
    ("PUDDING", "Colonel's Pudding Shop", "food", 2, "CANTT", 840, 160),
    ("CHOLE", "Cantt Chole Bhature", "food", 5, "CANTT", 910, 160),
    ("SANDWICH", "Club Sandwich Counter", "food", 1, "CANTT", 735, 220),
    ("ROPEWAY", "Valley Ropeway Ride", "attraction", 5, "VALLEY", 770, 320),
    ("FALLS", "Seven Sisters Falls", "attraction", 4, "VALLEY", 910, 320),
    ("PINETRAIL", "Deodar Pine Trail", "attraction", 3, "VALLEY", 805, 380),
    ("VIEWDECK", "Glass Skywalk Viewdeck", "attraction", 2, "VALLEY", 945, 380),
    ("CAMPFIRE", "Campfire Kitchen", "food", 3, "VALLEY", 770, 440),
    ("MUSHROOM", "Wild Mushroom Stall", "food", 1, "VALLEY", 840, 440),
    ("CHAIDHABA", "Highway Chai Dhaba", "food", 2, "VALLEY", 910, 440),
    ("APPLE", "Apple Orchard Cafe", "food", 4, "VALLEY", 735, 500),
]
