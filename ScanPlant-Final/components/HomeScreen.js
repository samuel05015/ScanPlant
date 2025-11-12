import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, BaseStyles, Icons } from './styles/DesignSystem';
import { Feather } from '@expo/vector-icons';

// Respostas pré-definidas para perguntas comuns sobre plantas
const PLANT_RESPONSES = {
  default: "Olá! Sou o assistente virtual do ScanPlant. Como posso ajudar com suas plantas hoje?",
  greeting: ["Olá! Como posso ajudar?", "Oi! Precisa de ajuda com plantas?", "Olá, sou o assistente do ScanPlant!"],
  notFound: "Desculpe, não tenho informações específicas sobre isso. Tente perguntar sobre rega, luz, plantio ou cuidados gerais com plantas.",
  water: ["A maioria das plantas precisa ser regada quando a camada superior do solo estiver seca.", "Evite encharcar as raízes."],
  light: ["A maioria das plantas de interior precisa de luz indireta brilhante.", "Luz solar direta pode queimar as folhas de algumas plantas."],
  soil: ["Um bom solo deve ter drenagem adequada.", "Adicionar perlita ou areia pode ajudar a melhorar a drenagem."],
  problems: ["Folhas amarelando geralmente indicam excesso de água ou falta de nutrientes.", "Pontas marrons nas folhas podem indicar ar muito seco."]
};

// Função para gerar resposta com base no texto da pergunta
const generateResponse = (question) => {
  const q = question.toLowerCase();
  
  if (q.includes('olá') || q.includes('oi')) return PLANT_RESPONSES.greeting[Math.floor(Math.random() * PLANT_RESPONSES.greeting.length)];
  if (q.includes('água') || q.includes('regar')) return PLANT_RESPONSES.water[Math.floor(Math.random() * PLANT_RESPONSES.water.length)];
  if (q.includes('sol') || q.includes('luz')) return PLANT_RESPONSES.light[Math.floor(Math.random() * PLANT_RESPONSES.light.length)];
  if (q.includes('solo') || q.includes('terra')) return PLANT_RESPONSES.soil[Math.floor(Math.random() * PLANT_RESPONSES.soil.length)];
  if (q.includes('problema') || q.includes('doença')) return PLANT_RESPONSES.problems[Math.floor(Math.random() * PLANT_RESPONSES.problems.length)];
  
  return PLANT_RESPONSES.notFound;
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState([{ id: '1', text: PLANT_RESPONSES.default, sender: 'bot' }]);
  const [inputText, setInputText] = useState('');

  const goToPlantGallery = () => {
    navigation.navigate('PlantGallery');
  };

  const goToPhotoScreen = () => {
    navigation.navigate('PhotoScreen');
  };

  const goToSearchScreen = () => {
    navigation.navigate('SearchScreen');
  };

  const goToProfileSettings = () => {
    navigation.navigate('ProfileSettings');
  };
  
  const openChat = () => setChatVisible(true);
  const closeChat = () => setChatVisible(false);
  
  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    // Adiciona a mensagem do usuário
    const userMessage = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages(currentMessages => [...currentMessages, userMessage]);
    
    // Gera e adiciona a resposta do bot
    setTimeout(() => {
      const botResponse = { id: (Date.now() + 1).toString(), text: generateResponse(inputText), sender: 'bot' };
      setMessages(currentMessages => [...currentMessages, botResponse]);
    }, 500);
    
    setInputText('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Header com logo, assistente botânico e botão de perfil */}
      <View style={styles.header}>
        <Image
          source={require('../assets/imagemlogotcc.png')}
          style={styles.smallLogo}
          resizeMode="contain"
        />
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.assistantButton}
            onPress={() => navigation.navigate('PlantAssistantChat')}
          >
            <View style={styles.assistantIconBackground}>
              <Text style={styles.assistantIcon}>🌿</Text>
            </View>
            <Text style={styles.assistantText}>Assistente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={goToProfileSettings}
          >
            <Text style={styles.profileIcon}>{Icons.settings}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <Text style={styles.welcomeText}>Bem-vindo ao ScanPlant</Text>
          <Text style={styles.descriptionText}>
            Descubra o mundo das plantas com inteligência artificial
          </Text>
        </View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryCard} onPress={goToPhotoScreen}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>{Icons.identify}</Text>
              </View>
              <Text style={styles.primaryCardTitle}>Identificar Planta</Text>
              <Text style={styles.primaryCardSubtitle}>
                Tire uma foto e descubra informações detalhadas
              </Text>
            </TouchableOpacity>
  
            <View style={styles.secondaryCardsRow}>
              <TouchableOpacity 
                style={styles.secondaryCard} 
                onPress={() => {
                  navigation.navigate('PlantGallery', { initialMode: 'personal' });
                }}
              >
                <View style={styles.secondaryCardIcon}>
                  <Text style={styles.secondaryCardIconText}>🌱</Text>
                </View>
                <Text style={styles.secondaryCardTitle}>Minhas Plantas</Text>
                <Text style={styles.secondaryCardSubtitle}>Sua coleção</Text>
              </TouchableOpacity>
 
             <TouchableOpacity 
               style={styles.secondaryCard} 
               onPress={() => {
                 navigation.navigate('PlantGallery', { initialMode: 'community' });
               }}
             >
               <View style={styles.secondaryCardIcon}>
                 <Text style={styles.secondaryCardIconText}>👥</Text>
               </View>
               <Text style={styles.secondaryCardTitle}>Comunidade</Text>
               <Text style={styles.secondaryCardSubtitle}>Plantas compartilhadas</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.secondaryCardsRow}>
             <TouchableOpacity 
               style={styles.secondaryCard} 
               onPress={goToSearchScreen}
             >
               <View style={styles.secondaryCardIcon}>
                 <Text style={styles.secondaryCardIconText}>🔍</Text>
               </View>
               <Text style={styles.secondaryCardTitle}>Explorar</Text>
               <Text style={styles.secondaryCardSubtitle}>Buscar plantas</Text>
             </TouchableOpacity>

             <TouchableOpacity 
               style={[styles.secondaryCard, styles.newFeatureCard]} 
               onPress={() => navigation.navigate('ChatList')}
             >
               <View style={styles.badgeNew}>
                 <Text style={styles.badgeText}>NOVO</Text>
               </View>
               <View style={styles.secondaryCardIcon}>
                 <Text style={styles.secondaryCardIconText}>💬</Text>
               </View>
               <Text style={styles.secondaryCardTitle}>Chat</Text>
               <Text style={styles.secondaryCardSubtitle}>Converse com outros</Text>
             </TouchableOpacity>
           </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Recursos</Text>
          
          {/* Novos recursos */}
          <View style={styles.featureItem}>
            <Text style={[styles.featureIcon, styles.newFeatureHighlight]}>💬</Text>
            <View style={styles.featureContent}>
              <View style={styles.featureTitleContainer}>
                <Text style={styles.featureTitle}>Chat com a Comunidade</Text>
                <View style={styles.featureNewBadge}>
                  <Text style={styles.featureNewBadgeText}>NOVO</Text>
                </View>
              </View>
              <Text style={styles.featureDescription}>
                Converse com outros entusiastas de plantas sobre suas dúvidas
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={[styles.featureIcon, styles.newFeatureHighlight]}>🔍</Text>
            <View style={styles.featureContent}>
              <View style={styles.featureTitleContainer}>
                <Text style={styles.featureTitle}>Exploração Aprimorada</Text>
                <View style={styles.featureNewBadge}>
                  <Text style={styles.featureNewBadgeText}>NOVO</Text>
                </View>
              </View>
              <Text style={styles.featureDescription}>
                Interface melhorada para descobrir novas espécies de plantas
              </Text>
            </View>
          </View>
          
          {/* Recursos existentes */}
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>{Icons.leaf}</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Identificação Precisa</Text>
              <Text style={styles.featureDescription}>
                IA avançada para identificar milhares de espécies
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>{Icons.location}</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Localização GPS</Text>
              <Text style={styles.featureDescription}>
                Registre onde encontrou cada planta
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>{Icons.save}</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Coleção Pessoal</Text>
              <Text style={styles.featureDescription}>
                Mantenha um registro de suas descobertas
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...BaseStyles.container,
    height: '100%',
  },
  
  // Estilo para o header com logo, assistente e botão de perfil
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  
  smallLogo: {
    width: 110,
    height: 60,
    resizeMode: 'contain',
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  assistantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 150, 136, 0.85)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    marginRight: Spacing.md,
    ...Shadows.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  
  assistantIconBackground: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  assistantIcon: {
    fontSize: 16,
  },
  
  assistantText: {
    ...Typography.styles.button,
    color: Colors.text.inverse,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  
  profileIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary[600],
  },
  
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  
  logoContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  
  welcomeText: {
    ...Typography.styles.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  
  descriptionText: {
    ...Typography.styles.caption,
    textAlign: 'center',
    maxWidth: 280,
  },
  
  actionsContainer: {
    marginBottom: Spacing['2xl'],
  },
  
  primaryCard: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.xl,
    borderWidth: 1,
    borderColor: Colors.primary[400],
  },
  
  cardIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
    borderWidth: 2,
    borderColor: Colors.primary[300],
  },
  
  cardIconText: {
    fontSize: 28,
  },
  
  primaryCardTitle: {
    ...Typography.styles.h3,
    color: Colors.text.inverse,
    marginBottom: Spacing.sm,
  },
  
  primaryCardSubtitle: {
    ...Typography.styles.body,
    color: Colors.primary[100],
    textAlign: 'center',
  },
  
  secondaryCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md, // Reduzindo espaço vertical entre as linhas de cards
  },
  
  secondaryCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs/2, // Reduzindo espaço horizontal entre os cards
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    minHeight: 130,
  },
  
  secondaryCardIcon: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary[300],
  },
  
  secondaryCardIconText: {
    fontSize: 24,
  },
  
  secondaryCardTitle: {
    ...Typography.styles.bodyMedium,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  
  secondaryCardSubtitle: {
    ...Typography.styles.small,
    textAlign: 'center',
  },
  
  featuresContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    marginTop: Spacing.md,
  },
  
  featuresTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.lg,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  
  featureIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
    width: 32,
    textAlign: 'center',
  },
  
  featureContent: {
    flex: 1,
  },
  
  featureTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  
  featureTitle: {
    ...Typography.styles.bodyMedium,
    marginRight: Spacing.sm,
  },
  
  featureDescription: {
    ...Typography.styles.caption,
  },
  
  newFeatureHighlight: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.full,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    color: Colors.primary[700],
  },
  
  featureNewBadge: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  
  featureNewBadgeText: {
    ...Typography.styles.captionBold,
    color: Colors.white,
    fontSize: 8,
  },
  
  // Estilos para o novo recurso de chat
  newFeatureCard: {
    borderWidth: 2,
    borderColor: Colors.primary[400],
    position: 'relative',
    overflow: 'visible',
  },
  
  badgeNew: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
    zIndex: 1,
    ...Shadows.small,
  },
  
  badgeText: {
    ...Typography.styles.captionBold,
    color: Colors.white,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  
  // Estilos para a seção de novidades
  newFeaturesSection: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  
  newFeaturesTitle: {
    ...Typography.styles.h2,
    color: Colors.primary[700],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  
  newFeaturesList: {
    marginTop: Spacing.md,
  },
  
  newFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  
  newFeatureIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  
  newFeatureContent: {
    flex: 1,
  },
  
  newFeatureTitle: {
    ...Typography.styles.bodyBold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs / 2,
  },
  
  newFeatureDescription: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
});

export default HomeScreen;
