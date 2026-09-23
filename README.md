Project Overview
Domain: Blog with users, posts, and comments.

Key decision: Comments are referenced in a separate collection, not embedded in post documents.

Indexes added:

MongoDB: comments.postId (speeds up fetching comments for a post)

SQL: comments(post_id) (speeds up the equivalent SQL join)

Verification: A setup.js script seeds data, bulk-inserts 5,000 comments, and runs .explain() to prove the index is used (IXSCAN instead of COLLSCAN).

Tech Stack
Node.js

Mongoose (ODM for MongoDB)

MongoDB Atlas (free tier)

dotenv (environment variables)

Setup Instructions
1. Clone the repository
bash
git clone <https://github.com/Asokydv-777/MongoDB-Modeling-Indexing>
cd phase6-task2
2. Install dependencies
bash
npm install
3. Create a MongoDB Atlas cluster
Sign up at MongoDB Atlas.

Create a free M0 cluster.

Create a database user and whitelist your IP address.

Copy the connection string (Node.js driver).

4. Configure environment variables
Create a .env file in the project root:

text
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/blogDB?retryWrites=true&w=majority
Replace <username>, <password>, and the cluster host with your own.

5. Add .gitignore
Ensure .env and node_modules/ are not committed:

text
node_modules/
.env
6. Run the setup script
bash
node setup.js
You should see output confirming connection, data seeding, index creation, and .explain() results.

MongoDB Schema
Users Collection
javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique)
}
Posts Collection
javascript
{
  _id: ObjectId,
  title: String,
  authorId: ObjectId (ref: 'User'),
  createdAt: Date
}
Comments Collection
javascript
{
  _id: ObjectId,
  text: String,
  postId: ObjectId (ref: 'Post'),
  authorId: ObjectId (ref: 'User'),
  createdAt: Date
}
Index on postId:

javascript
commentSchema.index({ postId: 1 });
Embedding vs. Referencing Decision
Decision: Comments are referenced in a separate collection.

Justification (one sentence):
Comments are referenced rather than embedded because a popular post can accumulate thousands of comments, which would risk hitting MongoDB's 16 MB document size limit and make every post fetch unnecessarily heavy even when comments aren't needed.

This reasoning accounts for scale: if comments were capped at 5 per post, embedding would be acceptable, but unbounded growth makes referencing the safer and more performant choice.

Indexes and Justifications
MongoDB Index
javascript
db.comments.createIndex({ postId: 1 });
Justification:
Speeds up the frequent query "find all comments for a given post" (db.comments.find({ postId: someId })), which runs every time a post page is viewed. Without this index, MongoDB would perform a collection scan (COLLSCAN).

SQL Index
sql
CREATE INDEX idx_comments_post_id ON comments(post_id);
Justification:
Speeds up queries that join comments to posts on comments.post_id (e.g., "get all comments for a post"). Without it, PostgreSQL would perform a sequential scan on the entire comments table for every join.

Running the Script and Understanding .explain()
The setup.js script does the following:

Connects to MongoDB Atlas.

Clears existing data.

Seeds 3 users, 3 posts, and 2 comments.

Ensures the postId index exists.

Runs .explain('executionStats') on the small dataset.

Bulk-inserts 5,000 comments for the first post.

Runs .explain('executionStats') again on the large dataset.

Cleans up the bulk test data.

Sample output (large dataset):

text
--- EXPLAIN (large dataset) ---
Winning plan stage: IXSCAN
Docs examined: 5002
Docs returned: 5002
IXSCAN means the index was used.

totalDocsExamined is close to the number of matching documents, not the total collection size.

If you see COLLSCAN, the index was not used (expected on the small dataset, but should not happen on the large one).

DNS Workaround (Windows)
If you encounter querySrv ECONNREFUSED on Windows, add this to the top of setup.js:

javascript
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
This forces Node.js to use Google's public DNS for SRV lookups.# MongoDB-Modeling-Indexing
# MongoDB-Modeling-Indexing
