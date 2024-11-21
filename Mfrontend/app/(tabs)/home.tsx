import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import AuthGuard from '../middleware/AuthGuard';


type Post = {
    id: number;
    title: string;
    content: string;
    author: {
      id: number;
      name: string;
    };
  };

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  

  
  
  useEffect(() => {
    fetchPosts();
    
  }, []);

  const getAuthorId = async (): Promise<number | null> => {
    try {
      const token = await AsyncStorage.getItem('@authToken');
      if (token) {
        const decoded: { id: number } = jwtDecode(token);
        return decoded.id;
      }
      return null;
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      return null;
    }
  };
    

 
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      Alert.alert('Erro', 'Não foi possível carregar os posts');
    } finally {
      setLoading(false);
    }
  };


  const handleCreatePost = async () => {
    if (!title || !content) {
      console.log('Erro', 'Título e conteúdo são obrigatórios');
      return;
    }
  
    try {
      const authorId = await getAuthorId(); 
      if (!authorId) {
        console.log('Erro', 'Não foi possível identificar o autor');
        return;
      }
  
      const token = await AsyncStorage.getItem('@authToken');
      const response = await fetch('http://localhost:3000/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, authorId }), 
      });
  
      const result = await response.json();
      console.log('Post criado com sucesso:', result);
      fetchPosts();
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Erro ao criar post:', error);
      console.log('Erro', 'Não foi possível criar o post');
    }
  };
  
  

  
  const handleEditPost = async () => {
    if (!title || !content) {
      console.log('Erro', 'Título e conteúdo são obrigatórios');
      return;
    }
  
    try {
      const authorId = await getAuthorId();
      if (!authorId) {
        console.log('Erro', 'Não foi possível identificar o autor');
        return;
      }
  
      const token = await AsyncStorage.getItem('@authToken');
      const response = await fetch(`http://localhost:3000/posts/edit/${editingPostId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, authorId }),
      });
  
      const result = await response.json();
      console.log('Post atualizado com sucesso:', result);
      fetchPosts();
      setEditingPostId(null);
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Erro ao editar post:', error);
      Alert.alert('Erro', 'Não foi possível editar o post');
    }
  };
  

  // Função para deletar um post
  const handleDeletePost = async (postId: number) => {
    try {
      const token = await AsyncStorage.getItem('@authToken');
      const response = await fetch(`http://localhost:3000/posts/delete/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      Alert.alert('Sucesso', result.message);
      fetchPosts();
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      Alert.alert('Erro', 'Não foi possível deletar o post');
    }
  };

  

  const renderPost = ({ item }: { item: Post }) => (
    
    <View style={{ padding: 10, marginVertical: 5, backgroundColor: 'lightgray' }}>
      <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
      <Text>{item.content}</Text>
      
      
      <Button title="Editar" onPress={() => { setEditingPostId(item.id); setTitle(item.title); setContent(item.content); }} />
      <Button title="Excluir" onPress={() => handleDeletePost(item.id)} />
    </View>
  );

  return (
    <AuthGuard>
      <View style={{ flex: 1, padding: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color="red" />
        ) : (
          <>
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id.toString()}
            />
            <TextInput
              placeholder="Título"
              value={title}
              onChangeText={setTitle}
              style={{ borderBottomWidth: 1, marginVertical: 10 }}
            />
            <TextInput
              placeholder="Conteúdo"
              value={content}
              onChangeText={setContent}
              style={{ borderBottomWidth: 1, marginVertical: 10 }}
            />
            {editingPostId ? (
              <Button title="Atualizar Post" onPress={handleEditPost} />
            ) : (
              <Button title="Criar Post" onPress={handleCreatePost} />
            )}
          </>
        )}
      </View>
    </AuthGuard>
  );
}
