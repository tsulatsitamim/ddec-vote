require("dotenv").config();
const { body, validationResult } = require("express-validator");

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

app.get("/result", async (req, res) => {
  try {
    const votes = await knex("votes")
      .select("candidate")
      .count("candidate", { as: "count" })
      .groupBy("candidate")
      .as("counts");

    return res.send(
      votes.reduce(
        (obj, item) => Object.assign(obj, { [item.candidate]: item.count }),
        {}
      )
    );
  } catch (error) {
    console.log(error);
  }
});

app.post(
  "/votes",
  body("name").notEmpty().withMessage('Nama Harus Diisi'),
  body("phone").notEmpty().withMessage('Nomor Telepon Harus Diisi').isMobilePhone().withMessage('Nomor Telepon tidak sesuai'),
  body("email").notEmpty().withMessage('Email Harus Diisi').isEmail().withMessage('Email tidak sesuai'),
  body('candidate').notEmpty().withMessage('Kandidat Harus Diisi').isIn(['indonesia', 'malaysia']).withMessage('Kandidat hanya bisa di isi dengan malaysia atai indonesia'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const name = req.body.name;
      const phone = req.body.phone;
      const email = req.body.email;
      const candidate = req.body.candidate;

      const date = new Date().toISOString().substring(0, 10);

      const haveVoteToday = await knex("votes")
        .where("date", date)
        .where((q) => q.where("email", email).orWhere("phone", phone))
        .first();

      if (haveVoteToday) {
        return res
          .status(400)
          .send({ message: "Vote Minimal 1 kali per email/nomor HP" });
      }

      const id = await knex("votes").insert({
        name,
        phone,
        email,
        candidate,
        date,
      });

      res.json({
        id: id[0],
        name,
        phone,
        email,
        candidate,
        date,
      });
    } catch (e) {
      console.log(e);
      // next(e)
    }
  }
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
