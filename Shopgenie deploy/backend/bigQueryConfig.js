const { BigQuery } = require("@google-cloud/bigquery");

const bigquery = new BigQuery();

async function fetchBrowsingHistory(userId) {
  const query = `
    SELECT product_id, category
    FROM \`exalted-entity-341315.shopgenie.userdata\`
    WHERE userid = userId
    ORDER BY timestamp DESC
    LIMIT 10;
  `;

  const options = {
    query: query,
    params: { userId: userId },
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows; // Return rows as an array of objects
  } catch (err) {
    console.error("BigQuery Error:", err);
    throw err;
  }

  // const [rows] = await bigquery.query(options);
  // return rows;
}

module.exports = { fetchBrowsingHistory };
