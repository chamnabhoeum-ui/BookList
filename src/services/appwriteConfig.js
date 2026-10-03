import 'react-native-url-polyfill/auto';
import { Client, TablesDB, ID } from 'react-native-appwrite';

const client = new Client();
client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_NAME);

export const tablesDB = new TablesDB(client);

export const config = {
  db: process.env.EXPO_PUBLIC_APPWRITE_DB_ID,
  table: {
    books: process.env.EXPO_PUBLIC_APPWRITE_TABLE_BOOKS_ID,
  },
};

export { ID };