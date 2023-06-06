const express = require("express");

const app = express();
app.use(express.json());

const dateTime = require("date-fns");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (Error) {
    console.log(`DB Error ${Error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//convertDbObject To ServerObject\
const convertDbObjectToServerObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

// Get todos API

app.get("/todos/", async (request, response) => {
  const { category, priority, status, due_date, search_q = "" } = request.query;

  let getTodosQuery;
  let getTodosDetails;
  switch (true) {
    case priority !== undefined && status !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}' AND status='${status}';`;
          getTodosDetails = await db.all(getTodosQuery);
          response.send(
            getTodosDetails.map((eachObject) =>
              convertDbObjectToServerObject(eachObject)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}';`;
        getTodosDetails = await db.all(getTodosQuery);
        response.send(
          getTodosDetails.map((eachObject) =>
            convertDbObjectToServerObject(eachObject)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status='${status}';`;
        getTodosDetails = await db.all(getTodosQuery);
        response.send(
          getTodosDetails.map((eachObject) =>
            convertDbObjectToServerObject(eachObject)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case search_q !== undefined:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      getTodosDetails = await db.all(getTodosQuery);
      response.send(
        getTodosDetails.map((eachObject) =>
          convertDbObjectToServerObject(eachObject)
        )
      );
      break;
    default:
      getTodosQuery = `SELECT * FROM todo;`;
      getTodosDetails = await db.all(getTodosQuery);
      response.send(
        getTodosDetails.map((eachObject) =>
          convertDbObjectToServerObject(eachObject)
        )
      );
  }
});

//Get Specific todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id=${todoId};
  `;
  const getTodoDetails = await db.get(getTodoQuery);
  response.send(convertDbObjectToServerObject(getTodoDetails));
});

//Create todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const addTodosQuery = `INSERT INTO
     todo(id, todo, priority, status)
     values(
         ${id},
         '${todo}',
         '${priority}',
         '${status}'
         );`;
  const dbResponse = await db.run(addTodosQuery);
  response.send("Todo Successfully Added");
});

//Update todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let addTodoQuery;
  switch (true) {
    case todo !== undefined:
      if (todo !== undefined) {
        addTodoQuery = `
                UPDATE todo
                SET 
                    todo='${todo}'
                WHERE id=${todoId}
                ;
            `;
        await db.run(addTodoQuery);
        response.send("Todo Updated");
      }
      break;
    case priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        addTodoQuery = `
                UPDATE todo
                SET 
                    priority='${priority}'
                ;
            `;
        await db.run(addTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        addTodoQuery = `
            UPDATE todo
            SET
                status='${status}'
            WHERE id=${todoId}
            ;
        `;
        await db.run(addTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
  }
});

//Delete todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const removeTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.get(removeTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
