import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica'
  },
  header: {
    backgroundColor: '#10B981',
    padding: 20,
    marginBottom: 20,
    borderRadius: 5
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 5
  },
  section: {
    marginBottom: 15,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  label: {
    fontSize: 10,
    color: '#666'
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333'
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981'
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    textAlign: 'center',
    fontSize: 8,
    color: '#999'
  }
});

export default function ReceiptPDF({ contribution, pool, user, transaction }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ABBA CARRAA</Text>
          <Text style={styles.subtitle}>Official Contribution Receipt</Text>
        </View>

        {/* Receipt Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt Number:</Text>
            <Text style={styles.value}>{transaction?.transaction_id || contribution.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Contributor Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{user?.full_name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{user?.phone || 'N/A'}</Text>
          </View>
        </View>

        {/* Pool Info */}
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Prize Pool Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Pool Name:</Text>
            <Text style={styles.value}>{pool?.prize_name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pool Target:</Text>
            <Text style={styles.value}>ETB {pool?.target_amount?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Your Contribution:</Text>
            <Text style={styles.amount}>ETB {contribution?.amount?.toLocaleString() || 0}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>{contribution?.payment_method?.toUpperCase() || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID:</Text>
            <Text style={styles.value}>{transaction?.transaction_id || contribution.transaction_id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={{ color: '#10B981', fontWeight: 'bold' }}>✓ COMPLETED</Text>
          </View>
        </View>

        {/* Tickets Info */}
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Entry Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tickets Earned:</Text>
            <Text style={styles.value}>{Math.floor((contribution?.amount || 0) / 100)} tickets</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Winning Chance:</Text>
            <Text style={styles.value}>
              ~{((contribution?.amount || 0) / (pool?.target_amount || 1) * 100).toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is an official receipt from Abbaa Carraa Prize Platform</Text>
          <Text>For support, contact: support@abbaacarraa.com</Text>
          <Text>© {new Date().getFullYear()} Abbaa Carraa - All rights reserved</Text>
        </View>
      </Page>
    </Document>
  );
}
