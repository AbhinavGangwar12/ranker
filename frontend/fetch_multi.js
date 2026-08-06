// The official JSON file powering the MMMU leaderboard website
const jsonUrl = "https://raw.githubusercontent.com/MMMU-Benchmark/mmmu-benchmark.github.io/main/leaderboard_data.json";

const colors = [
    "from-green-500 to-emerald-700",
    "from-orange-400 to-red-500",
    "from-blue-400 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600"
];

const icons = ["fa-brain", "fa-robot", "fa-sparkles", "fa-cube", "fa-wind", "fa-server"];

export async function fetchTopModels() {
    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error("Failed to fetch MMMU leaderboard data.");
        
        const data = await response.json();
        const rawList = data.leaderboardData || [];

        // 1. Filter out human benchmarks so we only rank actual AI models
        const aiModels = rawList.filter(item => item.info?.type !== "human_expert");

        // 2. Extract and parse model properties
        const parsedModels = aiModels.map(item => {
            // Check 'pro.overall' first (MMMU-Pro), fall back to 'validation.overall'
            const rawScoreStr = item.pro?.overall || item.validation?.overall || "0";
            const numScore = parseFloat(rawScoreStr) || 0;

            return {
                Name: item.info?.name || "Unknown Model",
                DataSource: item.info?.type || "proprietary", // e.g. "proprietary", "open_weights"
                scoreNum: numScore,
                ScoreStr: numScore > 0 ? numScore.toFixed(2) : "N/A"
            };
        });

        // 3. Sort models descending by score
        parsedModels.sort((a, b) => b.scoreNum - a.scoreNum);

        // 4. Slice top 10 and map to your UI format
        const top10 = parsedModels.slice(0, 10).map((model, index) => {
            return {
                Rank: index + 1,
                Name: model.Name,
                DataSource: model.DataSource,
                Score: model.ScoreStr,
                scoreNum: model.scoreNum,
                color: colors[index % colors.length],
                icon: icons[index % icons.length]
            };
        });

        return top10;
    } catch (error) {
        console.error("Error fetching or parsing MMMU data:", error);
        return [];
    }
}