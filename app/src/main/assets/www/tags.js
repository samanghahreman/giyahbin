/* ویژگی‌های ظاهری برای «شناسایی راهنما» (آفلاین)
   قالب: نوع|رنگ گل/میوه|محل رویش
   نوع: T درخت S درختچه H علف C پیچ/بالارونده B پیازدار F قارچ P آپارتمانی/زینتی
   رنگ: w سفید y زرد/نارنجی r قرمز/صورتی v بنفش/آبی g سبز/بی‌گل k سیاه/قهوه‌ای (میوه)
   محل: w کنار آب f جنگل m کوهستان/مرتع d بیابان/خشک g باغ/خانه r کنار جاده/زمین رها */
var TAGS={
"nerium-oleander":"S|rw|grw","cascabela-thevetia":"S|y|g","conium-maculatum":"H|w|r","cicuta-virosa":"H|w|w",
"datura-stramonium":"H|wv|r","datura-innoxia":"H|w|rd","brugmansia-suaveolens":"S|wyr|g","atropa-belladonna":"S|vk|f",
"hyoscyamus-niger":"H|yv|rd","ricinus-communis":"S|gr|rg","digitalis-purpurea":"H|rv|fm","aconitum-spp-":"H|v|m",
"veratrum-album":"H|wg|m","colchicum-spp-":"B|rv|m","convallaria-majalis":"H|w|fg","taxus-baccata":"T|rg|f",
"laburnum-anagyroides":"T|y|g","papaver-somniferum":"H|wrv|rg","calotropis-procera":"S|wv|d","amanita-phalloides":"F|gw|f",
"cycas-revoluta":"P|yr|g","cannabis-sativa":"H|g|rg","solanum-nigrum":"H|wk|r","solanum-dulcamara":"C|vr|fw",
"delphinium-spp-":"H|v|mg","helleborus-orientalis":"H|gvr|f","chelidonium-majus":"H|y|rf","euphorbia-spp-":"H|yg|rmd",
"citrullus-colocynthis":"C|y|d","ecballium-elaterium":"C|y|r","peganum-harmala":"H|w|dr","nicotiana-tabacum":"H|rw|g",
"hedera-helix":"C|gk|fg","dieffenbachia-spp-":"P|g|g","arum-spp-":"H|gr|f","cyclamen-spp-":"B|rw|fm",
"narcissus-spp-":"B|wy|g","lantana-camara":"S|yrk|g","cestrum-nocturnum":"S|wg|g","rhododendron-spp-":"S|rwv|gf",
"daphne-mucronata":"S|rw|m","sambucus-ebulus":"H|wk|rf","ruta-graveolens":"H|y|g","robinia-pseudoacacia":"T|w|rg",
"aesculus-hippocastanum":"T|wk|gf","prunus-dulcis-var-amara":"T|wr|gm","prunus-laurocerasus":"S|wk|g",
"phytolacca-americana":"H|wk|rf","pteridium-aquilinum":"H|g|f","senecio-vulgaris":"H|y|r","heliotropium-europaeum":"H|w|rd",
"lolium-temulentum":"H|g|r","lathyrus-sativus":"C|vw|r","amanita-muscaria":"F|r|f","papaver-rhoeas":"H|r|r",
"ranunculus-spp-":"H|y|rm","epipremnum-aureum":"P|g|g","iris-spp-":"B|wvy|g","albizia-julibrissin":"T|r|g",
"euphorbia-pulcherrima":"P|r|g","astragalus-spp-":"S|ywv|md","hypericum-perforatum":"H|y|rm","heracleum-persicum":"H|w|mf",
"catharanthus-roseus":"H|rw|g","rheum-ribes":"H|gr|m","mentha-longifolia":"H|vw|wr","thymus-kotschyanus":"H|rv|m",
"zataria-multiflora":"S|rw|dm","rosa-canina":"S|rw|rm","rosa-damascena":"S|r|g","matricaria-chamomilla":"H|w|r",
"taraxacum-officinale":"H|y|r","portulaca-oleracea":"H|y|rg","malva-sylvestris":"H|rv|r","urtica-dioica":"H|g|r",
"rhus-coriaria":"S|r|m","plantago-major":"H|g|r","allium-hirtifolium":"B|wv|m","nasturtium-officinale":"H|w|w",
"foeniculum-vulgare":"H|y|rm","crataegus-spp-":"S|wr|m","berberis-vulgaris":"S|yr|m","cornus-mas":"T|yr|fm",
"punica-granatum":"S|r|g","ficus-carica":"T|g|g","morus-alba":"T|wk|g","ziziphus-spina-christi":"T|yr|d",
"glycyrrhiza-glabra":"H|v|rd","cichorium-intybus":"H|v|r","tragopogon-spp-":"H|yv|r","chenopodium-album":"H|g|r",
"capparis-spinosa":"S|w|dm","descurainia-sophia":"H|y|r","castanea-sativa":"T|w|f","quercus-brantii":"T|g|fm",
"pistacia-atlantica":"T|r|m","platanus-orientalis":"T|g|wg","wisteria-sinensis":"C|v|g","hydrangea-macrophylla":"S|vrw|g",
"clematis-spp-":"C|wv|gf","anemone-spp-":"H|rvw|gm","lupinus-spp-":"H|vyr|g","hyacinthus-orientalis":"B|vrw|g",
"galanthus-spp-":"B|w|fm","hippeastrum-spp-":"B|r|g","tulipa-spp-":"B|ry|gm","lilium-spp-":"B|wy|g",
"philodendron-spp-":"P|g|g","alocasia-spp-":"P|g|gw","caladium-bicolor":"P|rg|g","spathiphyllum-spp-":"P|w|g",
"anthurium-spp-":"P|r|g","ficus-elastica":"P|g|g","aloe-vera":"P|y|g","sansevieria-trifasciata":"P|g|g",
"asparagus-densiflorus":"P|r|g","begonia-spp-":"H|rw|g","chrysanthemum-spp-":"H|ywr|g","artemisia-absinthium":"H|y|dm",
"tanacetum-vulgare":"H|y|r","ipomoea-spp-":"C|vr|gr","solanum-lycopersicum":"H|y|g","eucalyptus-spp-":"T|w|g",
"ginkgo-biloba":"T|g|g","ilex-spp-":"S|r|fg"
};
