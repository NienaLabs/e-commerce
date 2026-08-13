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

const BulletList = ({ items }: { items: string[] }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 16, paddingLeft: 8 }}>
      {items.map((item, idx) => (
        <View key={idx} style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={{ color: colors.primary, fontSize: 18, marginRight: 8, lineHeight: 22 }}>•</Text>
          <Text style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.inkMuted, lineHeight: 22 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.ink, marginBottom: 8 }}>
          Privacy Policy
        </Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkGhost, marginBottom: 24 }}>
          Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>

        <Paragraph>
          At Konura, we value your privacy and are committed to protecting your personal data in compliance with the General Data Protection Regulation (GDPR) and the Ghana Data Protection Act, 2012 (Act 843). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our mobile application and use our services. Please read this privacy policy carefully.
        </Paragraph>

        <Heading>1. Information We Collect</Heading>
        <Paragraph>
          We may collect information about you in a variety of ways. The information we may collect via the Application includes:
        </Paragraph>
        <BulletList 
          items={[
            "Personal Data: Name, email address, shipping address, billing address, phone number, and payment information when you make a purchase or register an account.",
            "Derivative Data: Information our servers automatically collect when you access the Application, such as your IP address, browser type, operating system, access times, and pages you have viewed directly.",
            "Mobile Device Data: Device information, such as your mobile device ID, model, and manufacturer, and information about the location of your device."
          ]} 
        />

        <Heading>2. How We Use Your Information</Heading>
        <Paragraph>
          Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:
        </Paragraph>
        <BulletList 
          items={[
            "Create and manage your account.",
            "Process your transactions and send you related information, including purchase confirmations and invoices.",
            "Deliver targeted advertising, coupons, newsletters, and other information regarding promotions and the Application.",
            "Monitor and analyze usage and trends to improve your experience with the Application.",
            "Resolve disputes and troubleshoot problems."
          ]} 
        />

        <Heading>3. Disclosure of Your Information</Heading>
        <Paragraph>
          We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
        </Paragraph>
        <BulletList 
          items={[
            "By Law or to Protect Rights: If we believe the release of information about you is necessary to respond to legal process or to protect the rights, property, and safety of others.",
            "Third-Party Service Providers: We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.",
            "Business Transfers: We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition."
          ]} 
        />

        <Heading>4. Security of Your Information</Heading>
        <Paragraph>
          We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </Paragraph>

        <Heading>5. Your Privacy Rights</Heading>
        <Paragraph>
          Under the General Data Protection Regulation (GDPR) and the Ghana Data Protection Act, 2012 (Act 843), you have specific rights regarding your personal information:
        </Paragraph>
        <BulletList 
          items={[
            "The right to access the personal information we hold about you.",
            "The right to request the correction of inaccurate or incomplete personal information.",
            "The right to request the deletion or erasure of your personal information.",
            "The right to object to or prevent the processing of your personal information (including for direct marketing purposes).",
            "The right to data portability.",
            "The right to be informed about how your data is collected and processed (Openness principle).",
            "The right to lodge a complaint with the Data Protection Commission (DPC) of Ghana or your local supervisory authority."
          ]} 
        />
        <Paragraph>
          To exercise any of these rights, please contact us using the information provided below.
        </Paragraph>

        <Heading>6. Policy for Children</Heading>
        <Paragraph>
          We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
        </Paragraph>

        <Heading>7. Updates to This Policy</Heading>
        <Paragraph>
          We may update this Privacy Policy from time to time in order to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the \"Effective Date\" at the top.
        </Paragraph>

        <Heading>8. Contact Us</Heading>
        <Paragraph>
          If you have questions or comments about this Privacy Policy, please contact us at: privacy@konura.com.
        </Paragraph>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
