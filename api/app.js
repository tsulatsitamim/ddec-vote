require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;

const cors = require("cors");
app.use(
  cors({
    origin: "*",
  })
);

const knex = require("knex")({
  client: "mysql",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
});

const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  bodyParser.json({
    limit: "8mb",
  })
);

app.get("/participants", async (req, res) => {
  const count = knex
    .select("club")
    .from("participants")
    .count("club", { as: "count" })
    .groupBy("club")
    .as("counts");

  const clubs = await knex
    .select("clubs.*", "counts.count")
    .leftJoin(count, "counts.club", "clubs.name")
    .orderBy("count", "desc")
    .orderBy("name", "asc")
    .limit(5)
    .from("clubs");

  return res.send(clubs);
});

app.post("/participants", async (req, res) => {
  try {
    const name = req.body.name;
    const phone = req.body.phone;
    const link = req.body.link;
    const club = req.body.club;

    const clubExist = await knex("clubs").where("name", club).first();
    if (!clubExist) {
      await knex("clubs").insert({ name: club });
    }

    const linkExist = await knex("participants").where("link", link).first();
    if (linkExist) {
      return res.status(400).send({message: 'Link sudah pernah diinput'})
    }

    const id = await knex("participants").insert({
      name,
      phone,
      link,
      club,
    });

    res.json({
      id: id[0],
      name,
      phone,
      link,
      club,
    });
  } catch (e) {
    console.log(e);
    // next(e)
  }
});

app.get("/clubs", async (req, res) => {
  const clubs = await knex.from("clubs").select("*").orderBy("name", "asc");

  return res.send(clubs);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
