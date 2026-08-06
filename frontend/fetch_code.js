// Replace this URL with the actual path to your JSON file. 
// If it's a local file in your project, you can use something like "./data.json"
const jsonUrl = "https://raw.githubusercontent.com/swe-bench/swe-bench.github.io/master/data/leaderboards.json";

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
        if (!response.ok) throw new Error("Failed to fetch the leaderboard JSON.");
        
        const data = await response.json();
        
        // Find the specific leaderboard named "bash-only"
        const targetLeaderboard = data.leaderboards.find(lb => lb.name === "bash-only");
        
        if (!targetLeaderboard) {
            throw new Error("Could not locate the 'bash-only' leaderboard in the JSON data.");
        }

        const validModels = targetLeaderboard.results;

        // Sort descending by the 'resolved' percentage score
        validModels.sort((a, b) => (b.resolved || 0) - (a.resolved || 0));
        
        // Grab the first 10 items and format them for the UI
        const top10 = validModels.slice(0, 10).map((model, index) => {
            const rawScore = model.resolved || 0; 
            
            // Extract the Organization from the tags array (e.g., "Org: Anthropic" -> "Anthropic")
            let orgName = "Unknown";
            if (model.tags && Array.isArray(model.tags)) {
                const orgTag = model.tags.find(tag => tag.startsWith("Org:"));
                if (orgTag) {
                    orgName = orgTag.replace("Org:", "").trim();
                }
            }
            
            return {
                Rank: index + 1,
                Name: model.name || "Unknown", 
                DataSource: orgName, // Renders the extracted Organization name
                Score: typeof rawScore === "number" ? rawScore.toFixed(2) + "%" : rawScore + "%",
                scoreNum: typeof rawScore === "number" ? rawScore : 0,
                color: colors[index % colors.length],
                icon: icons[index % icons.length]
            };
        });
        // console.log("Top 10 Models:", top10); // Debugging: Log the top 10 models to the console
        return top10;
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        return [];
    }
}
// fetchTopModels(); // debugging: Call the function to test it and log results to the console