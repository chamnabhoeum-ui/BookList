import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as bookService from '../services/bookService';

const STATUSES = ['To read', 'Reading', 'Finished'];
const FILTERS = ['All', ...STATUSES];
const STATUS_COLORS = {
  'To read': '#6b7280',
  Reading: '#2563eb',
  Finished: '#16a34a',
};

const dateOnly = (value) => (value ? value.slice(0, 10) : '');

const statusChanges = (book, next) => {
  const now = new Date().toISOString();
  if (next === 'To read') {
    return { status: next, startDate: null, completedDate: null };
  }
  if (next === 'Reading') {
    return { status: next, startDate: book.startDate || now, completedDate: null };
  }
  return { status: next, startDate: book.startDate || now, completedDate: now };
};

export default function Index() {
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBooks = async () => {
    try {
      const rows = await bookService.getBooks();
      setBooks(rows);
      setError('');
    } catch (e) {
      console.log(e);
      setError(e?.message || 'Could not load books.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBooks();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  const addBook = async () => {
    if (!title.trim() || !author.trim()) {
      setError('Please enter a title and an author.');
      return;
    }
    try {
      const newBook = await bookService.addBook({
        title: title.trim(),
        author: author.trim(),
        notes: notes.trim(),
      });
      setBooks([newBook, ...books]);
      setTitle('');
      setAuthor('');
      setNotes('');
      setError('');
    } catch (e) {
      console.log(e);
      setError(e?.message || 'Could not add the book.');
    }
  };

  const updateBook = async (book, data) => {
    try {
      const updated = await bookService.updateBook(book.$id, data);
      setBooks(books.map((b) => (b.$id === book.$id ? updated : b)));
      setError('');
    } catch (e) {
      console.log(e);
      setError(e?.message || 'Could not update the book.');
    }
  };

  const nextStatus = (book) => {
    const next = STATUSES[(STATUSES.indexOf(book.status) + 1) % STATUSES.length];
    updateBook(book, statusChanges(book, next));
  };

  const toggleFinished = (book) => {
    const next = book.status === 'Finished' ? 'Reading' : 'Finished';
    updateBook(book, statusChanges(book, next));
  };

  const setRating = (book, stars) => {
    updateBook(book, { rating: book.rating === stars ? 0 : stars });
  };

  const removeBook = async (id) => {
    try {
      await bookService.removeBook(id);
      setBooks(books.filter((b) => b.$id !== id));
    } catch (e) {
      console.log(e);
      setError(e?.message || 'Could not delete the book.');
    }
  };

  const visibleBooks = filter === 'All' ? books : books.filter((b) => b.status === filter);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>My Book List</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Book title"
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Author"
          placeholderTextColor="#888"
          value={author}
          onChangeText={setAuthor}
        />
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Note (optional)"
            placeholderTextColor="#888"
            value={notes}
            onChangeText={setNotes}
            onSubmitEditing={addBook}
          />
          <Pressable onPress={addBook} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={22} color="white" />
          </Pressable>
        </View>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={visibleBooks}
        keyExtractor={(item) => item.$id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={<Text style={styles.empty}>No books here yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Pressable onPress={() => toggleFinished(item)}>
                <MaterialCommunityIcons
                  name={item.status === 'Finished' ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={28}
                  color={item.status === 'Finished' ? '#16a34a' : '#555'}
                />
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text style={[styles.bookTitle, item.status === 'Finished' && styles.finishedTitle]}>
                  {item.title}
                </Text>
                <Text style={styles.bookAuthor}>by {item.author}</Text>
              </View>

              <Pressable onPress={() => router.push(`/books/${item.$id}`)}>
                <MaterialCommunityIcons name="pencil" size={24} color="#2563eb" />
              </Pressable>
              <Pressable onPress={() => removeBook(item.$id)}>
                <MaterialCommunityIcons name="delete-circle" size={34} color="red" />
              </Pressable>
            </View>

            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

            {item.startDate || item.completedDate ? (
              <View style={styles.dates}>
                {item.startDate ? (
                  <Text style={styles.dateText}>Started: {dateOnly(item.startDate)}</Text>
                ) : null}
                {item.completedDate ? (
                  <Text style={styles.dateText}>Finished: {dateOnly(item.completedDate)}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.cardBottom}>
              <Pressable
                onPress={() => nextStatus(item)}
                style={[styles.statusChip, { backgroundColor: STATUS_COLORS[item.status] }]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </Pressable>

              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setRating(item, n)}>
                    <MaterialCommunityIcons
                      name={n <= item.rating ? 'star' : 'star-outline'}
                      size={26}
                      color="#f59e0b"
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f6fa' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  form: { gap: 8, marginBottom: 12 },
  formRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { backgroundColor: 'white', borderRadius: 8, padding: 10, fontSize: 16 },
  addButton: { backgroundColor: '#2563eb', borderRadius: 20, padding: 9 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#111827' },
  filterText: { fontSize: 14, color: '#374151' },
  filterTextActive: { color: 'white' },
  error: { color: 'red', marginBottom: 8 },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 10, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookTitle: { fontSize: 18, fontWeight: '600' },
  finishedTitle: { color: '#6b7280' },
  bookAuthor: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  notes: { fontSize: 14, color: '#374151', fontStyle: 'italic' },
  dates: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  dateText: { fontSize: 13, color: '#6b7280' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusChip: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14 },
  statusText: { color: 'white', fontSize: 14, fontWeight: '500' },
  stars: { flexDirection: 'row' },
});