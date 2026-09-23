const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);



require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/Post");
const Comment = require("./models/Comment");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear existing data so the script can be re-run safely
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});
  console.log("Cleared existing data");

  // Seed users
  const users = await User.insertMany([
    { name: "ashok", email: "ashok@example.com" },
    { name: "Nishal", email: "nishal@example.com" },
    { name: "Anuu", email: "anuu@example.com" },
  ]);
  console.log("Inserted users");

  // Seed posts
  const posts = await Post.insertMany([
    { title: "First Post", authorId: users[0]._id },
    { title: "Second Post", authorId: users[0]._id },
    { title: "Third Post", authorId: users[1]._id },
  ]);
  console.log("Inserted posts");

  // Seed comments
  await Comment.insertMany([
    { text: "Great post!", postId: posts[0]._id, authorId: users[1]._id },
    {
      text: "Thanks for sharing",
      postId: posts[0]._id,
      authorId: users[2]._id,
    },
  ]);
  console.log("Inserted comments");

  // Ensure the index exists (redundant with schema, but explicit)
  await Comment.collection.createIndex({ postId: 1 });
  console.log("Ensured index on comments.postId");

  // Explain plan on small dataset
  const explainSmall = await Comment.collection
    .find({ postId: posts[0]._id })
    .explain("executionStats");
  console.log("\n--- EXPLAIN (small dataset) ---");
  console.log(
    "Winning plan stage:",
    explainSmall.queryPlanner.winningPlan.stage,
  );
  console.log("Docs examined:", explainSmall.executionStats.totalDocsExamined);
  console.log("Docs returned:", explainSmall.executionStats.nReturned);

  // Bulk insert 5000 comments to simulate scale
  const bulkComments = [];
  for (let i = 0; i < 5000; i++) {
    bulkComments.push({
      text: "Bulk comment " + i,
      postId: posts[0]._id,
      authorId: users[2]._id,
    });
  }
  await Comment.insertMany(bulkComments);
  console.log("\nInserted 5000 bulk comments");

  // Explain plan on large dataset
  const explainLarge = await Comment.collection
    .find({ postId: posts[0]._id })
    .explain("executionStats");
  console.log("\n--- EXPLAIN (large dataset) ---");
  console.log(
    "Winning plan stage:",
    explainLarge.queryPlanner.winningPlan.stage,
  );
  console.log("Docs examined:", explainLarge.executionStats.totalDocsExamined);
  console.log("Docs returned:", explainLarge.executionStats.nReturned);

  // Clean up bulk test data
  await Comment.deleteMany({ text: /^Bulk comment/ });
  console.log("\nCleaned up bulk test comments");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
