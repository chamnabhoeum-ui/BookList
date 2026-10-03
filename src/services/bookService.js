import { Query } from 'react-native-appwrite';
import { config, ID, tablesDB } from './appwriteConfig';

export const getBooks = async () => {
  const response = await tablesDB.listRows({
    databaseId: config.db,
    tableId: config.table.books,
    queries: [Query.orderDesc('$createdAt')],
  });
  return response.rows;
};

export const getBook = async (id) => {
  return await tablesDB.getRow({
    databaseId: config.db,
    tableId: config.table.books,
    rowId: id,
  });
};

export const addBook = async ({ title, author, notes }) => {
  const data = { title, author, status: 'To read', rating: 0 };
  if (notes) data.notes = notes;
  return await tablesDB.createRow({
    databaseId: config.db,
    tableId: config.table.books,
    rowId: ID.unique(),
    data,
  });
};

export const updateBook = async (id, data) => {
  return await tablesDB.updateRow({
    databaseId: config.db,
    tableId: config.table.books,
    rowId: id,
    data,
  });
};

export const removeBook = async (id) => {
  await tablesDB.deleteRow({
    databaseId: config.db,
    tableId: config.table.books,
    rowId: id,
  });
};