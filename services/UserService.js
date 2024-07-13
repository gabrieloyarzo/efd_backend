import db from "../dist/db/models/index.js";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

const createUser = async (req) => {
    const { name, email, password, password_second, cellphone } = req.body;
    if (password !== password_second) {
        return {
            code: 400,
            message: "Passwords do not match",
        };
    }
    const user = await db.User.findOne({
        where: {
            email: email,
        },
    });
    if (user) {
        return {
            code: 400,
            message: "User already exists",
        };
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.User.create({
        name,
        email,
        password: encryptedPassword,
        cellphone,
        status: true,
    });
    return {
        code: 200,
        message: "User created successfully with ID: " + newUser.id,
    };
};

const bulkCreateUsers = async (req) => {
    const users = req.body;
    let usersInsertedCount = 0;
    let usersNotInsertedCount = 0;

    for (const user of users) {
        const userReq = { body: user };
        const { code } = await createUser(userReq);
        code === 200 ? usersInsertedCount++ : usersNotInsertedCount++;
    }
    return {
        code: 200,
        message: `${usersInsertedCount} users created successfully, ${usersNotInsertedCount} users not inserted`,
    };
};

const getUserById = async (id) => {
    return {
        code: 200,
        message: await db.User.findOne({
            where: {
                id: id,
                status: true,
            },
        }),
    };
};

const getAllUsers = async () => {
    return {
        code: 200,
        message: await db.User.findAll({
            where: {
                status: true,
            },
        }),
    };
};

const findUsers = async (req) => {
    const { active, name, login_after_date, login_before_date } = req.query;

    const userQuery = {};
    const sessionQuery = {};

    active && (userQuery.status = active === "true" ? true : false);
    name && (userQuery.name = { [Op.like]: `%${name}%` });

    login_after_date &&
        (sessionQuery.createdAt = {
            ...sessionQuery.createdAt,
            [Op.gte]: new Date(login_after_date),
        });
    login_before_date &&
        (sessionQuery.createdAt = {
            ...sessionQuery.createdAt,
            [Op.lte]: new Date(login_before_date),
        });

    const includeObj =
        Object.keys(sessionQuery).length > 0
            ? [
                  {
                      model: db.Session,
                      where: sessionQuery,
                      attributes: [],
                  },
              ]
            : [];

    return {
        code: 200,
        message: await db.User.findAll({
            where: userQuery,
            include: includeObj,
        }),
    };
};

const updateUser = async (req) => {
    const user = db.User.findOne({
        where: {
            id: req.params.id,
            status: true,
        },
    });
    const payload = {};
    payload.name = req.body.name ?? user.name;
    payload.password = req.body.password
        ? await bcrypt.hash(req.body.password, 10)
        : user.password;
    payload.cellphone = req.body.cellphone ?? user.cellphone;
    await db.User.update(payload, {
        where: {
            id: req.params.id,
        },
    });
    return {
        code: 200,
        message: "User updated successfully",
    };
};

const deleteUser = async (id) => {
    /* await db.User.destroy({
        where: {
            id: id
        }
    }); */
    const user = db.User.findOne({
        where: {
            id: id,
            status: true,
        },
    });
    await db.User.update(
        {
            status: false,
        },
        {
            where: {
                id: id,
            },
        }
    );
    return {
        code: 200,
        message: "User deleted successfully",
    };
};

export default {
    createUser,
    bulkCreateUsers,
    getUserById,
    getAllUsers,
    findUsers,
    updateUser,
    deleteUser,
};
