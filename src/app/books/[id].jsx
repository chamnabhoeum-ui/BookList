import { useState, useEffect } from 'react';
import { ScrollView, Text, TextInput, Pressable, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as bookService from '../../services/bookService';

const STATUSES = ['To read', 'Reading', 'Finished'];
const STATUS_COLORS = {
  'To read': '#6b7280',
  Reading: '#2563eb',
  Finished: '#16a34a',
};

const dateOnly = (value) => (value ? value.slice(0, 10) : '');

const toIso = (text) => {
  if (!text.trim()) return null;
  const d = new Date(text.trim());
  return isNaN(d.getTime()) ? undefined : d.toISOString();
};

export default function EditBook() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('To read');
  const [rating, setRating] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const book = await bookService.getBook(id);
        setTitle(book.title || '');
        setAuthor(book.author || '');
        setNotes(book.notes || '');
        setStatus(book.status || 'To read');
        setRating(book.rating || 0);
        setStartDate(dateOnly(book.startDate));
        setCompletedDate(dateOnly(book.completedDate));
      } catch (e) {
        console.log(e);
        setError(e?.message || 'Could not load the book.');
      }
    };
    fetchBook();
  }, [id]);

  const pickStatus = (s) => {
    const today = new Date().toISOString().slice(0, 10);
    setStatus(s);
    if (s === 'To read') {
      setStartDate('');
      setCompletedDate('');
    } else if (s === 'Reading') {
      if (!startDate) setStartDate(today);
      setCompletedDate('');
    } else {
      if (!startDate) setStartDate(today);
      if (!completedDate) setCompletedDate(today);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !author.trim()) {
      setError('Title and author are required.');
      return;
    }
    const start = toIso(startDate);
    const done = toIso(completedDate);
    if (start === undefined || done === undefined) {
      setError('Dates must look like 2026-10-03.');
      return;
    }
    try {
      await bookService.updateBook(id, {
        title: title.trim(),
        author: author.trim(),
        notes: notes.trim(),
        status,
        rating,
        startDate: start,
        completedDate: done,
      });
      router.back();
    } catch (e) {
      console.log(e);
      setError(e?.message || 'Could not save the book.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Author</Text>
        <TextInput style={styles.input} value={author} onChangeText={setAuthor} />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => (
            <Pressable
              key={s}
              onPress={() => pickStatus(s)}
              style={[
                styles.statusChip,
                { backgroundColor: status === s ? STATUS_COLORS[s] : '#e5e7eb' },
              ]}
            >
              <Text style={{ color: status === s ? 'white' : '#374151', fontSize: 14 }}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Rating</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(rating === n ? 0 : n)}>
              <MaterialCommunityIcons
                name={n <= rating ? 'star' : 'star-outline'}
                size={32}
                color="#f59e0b"
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Date started (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="2026-10-03"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Date finished (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={completedDate}
          onChangeText={setCompletedDate}
          placeholder="2026-10-10"
          placeholderTextColor="#888"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.buttonRow}>
          <Pressable onPress={handleSave} style={[styles.button, { backgroundColor: 'green' }]}>
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={[styles.button, { backgroundColor: 'red' }]}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { padding: 16, gap: 6 },
  label: { fontSize: 14, color: '#374151', marginTop: 8 },
  input: {
    backgroundColor: 'white',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  stars: { flexDirection: 'row' },
  error: { color: 'red', marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  button: { borderRadius: 6, paddingVertical: 10, paddingHorizontal: 22 },
  buttonText: { color: 'white', fontSize: 18 },
});