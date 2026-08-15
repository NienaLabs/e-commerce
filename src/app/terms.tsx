import { Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';

const Heading = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginTop: 24, marginBottom: 8 }}>
      {children}
    </Text>
  );
};

const Paragraph = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, lineHeight: 24, marginBottom: 16 }}>
      {children}
    </Text>
  );
};

export default function TermsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.ink, marginBottom: 8 }}>
          Terms of Service
        </Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkGhost, marginBottom: 24 }}>
          Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>

        <Paragraph>
          Welcome to Konura. These Terms of Service ("Terms") govern your access to and use of our mobile application, website, and related services (collectively, the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms and our Privacy Policy.
        </Paragraph>

        <Heading>1. Account Registration and Security</Heading>
        <Paragraph>
          To access certain features of the Platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process. You are solely responsible for safeguarding your password and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
        </Paragraph>

        <Heading>2. Purchases, Payments, and Billing</Heading>
        <Paragraph>
          When you make a purchase through our Platform, you agree to provide a valid payment method. All prices are subject to change without notice. We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available for purchase, inaccuracies, or errors in product or pricing information.
        </Paragraph>

        <Heading>3. Returns and Refunds</Heading>
        <Paragraph>
          Our Return Policy governs all returns and refunds for products purchased on the Platform. Products must be returned in their original condition within the specified return window. Refunds will be processed to the original payment method. Certain items, such as perishable goods or personalized products, may not be eligible for returns.
        </Paragraph>

        <Heading>4. User Conduct and Content</Heading>
        <Paragraph>
          You agree not to engage in any prohibited conduct, including but not limited to: violating any applicable law or regulation; infringing upon the rights of others; distributing viruses or harmful code; or interfering with the operation of the Platform. Any content you post, such as reviews or comments, must not be illegal, obscene, threatening, or defamatory. We reserve the right to remove any user content at our discretion.
        </Paragraph>

        <Heading>5. Intellectual Property Rights</Heading>
        <Paragraph>
          All content on the Platform, including text, graphics, logos, images, and software, is the property of Konura or its licensors and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.
        </Paragraph>

        <Heading>6. Disclaimers and Limitation of Liability</Heading>
        <Paragraph>
          The Platform and all products and services provided through it are provided "as is" and "as available" without any warranties of any kind. To the maximum extent permitted by law, Konura disclaims all warranties, express or implied. Konura shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform.
        </Paragraph>

        <Heading>7. Modifications to the Service and Terms</Heading>
        <Paragraph>
          We reserve the right to modify or discontinue, temporarily or permanently, the Platform or any features or portions thereof without prior notice. We may also revise these Terms from time to time. By continuing to access or use the Platform after those revisions become effective, you agree to be bound by the revised Terms.
        </Paragraph>

        <Heading>8. Governing Law and Data Protection</Heading>
        <Paragraph>
          These Terms shall be governed by and construed in accordance with the laws of the Republic of Ghana, without regard to its conflict of law provisions. Any processing of personal data will be conducted in strict compliance with the Ghana Data Protection Act, 2012 (Act 843) and other applicable international data protection regulations such as the GDPR.
        </Paragraph>

        <Heading>9. Contact Information</Heading>
        <Paragraph>
          If you have any questions about these Terms, please contact our support team at legal@konura.com.
        </Paragraph>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
