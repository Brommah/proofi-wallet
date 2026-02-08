import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Colors, Fonts, FontSize, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

/**
 * Standalone QR scanner screen for the tab navigator.
 * Scans Cere addresses and Proofi deep links.
 */
export function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannedType, setScannedType] = useState<'address' | 'proofi' | null>(null);
  const router = useRouter();

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (data.startsWith('proofi:')) {
      // Proofi-specific QR code (deep link)
      setScannedData(data);
      setScannedType('proofi');
    } else if (data.startsWith('5') && data.length >= 47) {
      // Looks like a Cere address (SS58 prefix 42)
      setScannedData(data);
      setScannedType('address');
    } else if (data.startsWith('6') && data.length >= 47) {
      // Cere address with prefix 54
      setScannedData(data);
      setScannedType('address');
    } else {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid Proofi credential or Cere address.',
        [
          { text: 'Scan Again', onPress: resetScan },
        ],
      );
    }
  };

  const resetScan = () => {
    setScanned(false);
    setScannedData(null);
    setScannedType(null);
  };

  const copyToClipboard = async () => {
    if (scannedData) {
      await Clipboard.setStringAsync(scannedData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  };

  const goToWallet = () => {
    // Navigate to wallet tab
    router.push('/(app)/wallet');
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>CAMERA ACCESS</Text>
        <Text style={styles.permissionText}>
          Proofi needs camera access to scan QR codes for credential sharing and address scanning.
        </Text>
        <Button title="GRANT ACCESS" onPress={requestPermission} />
      </View>
    );
  }

  // Show scanned result
  if (scanned && scannedData) {
    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTagline}>QR SCANNED</Text>
          <Text style={styles.resultTitle}>
            {scannedType === 'address' ? 'ADDRESS' : 'PROOFI LINK'}
          </Text>
        </View>

        <Card
          label={scannedType === 'address' ? 'CERE ADDRESS' : 'PROOFI DATA'}
          borderColor={Colors.cyanAlpha(0.3)}
          backgroundColor={Colors.cyanAlpha(0.05)}
        >
          <Text style={styles.scannedDataText} selectable>
            {scannedData}
          </Text>
        </Card>

        <View style={styles.resultActions}>
          <Button title="COPY TO CLIPBOARD" onPress={copyToClipboard} />
          {scannedType === 'address' && (
            <Button
              title="GO TO WALLET"
              onPress={goToWallet}
              variant="secondary"
            />
          )}
          <Button
            title="SCAN ANOTHER"
            onPress={resetScan}
            variant="ghost"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top */}
        <View style={styles.overlaySection}>
          <Text style={styles.scanTagline}>PROOFI SCANNER</Text>
          <Text style={styles.scanTitle}>SCAN QR CODE</Text>
          <Text style={styles.scanSubtitle}>
            Point your camera at a Cere address or Proofi QR code
          </Text>
        </View>

        {/* Scan Area */}
        <View style={styles.scanAreaContainer}>
          <View style={styles.scanArea}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Bottom */}
        <View style={styles.overlaySection}>
          <Text style={styles.scanHint}>
            Supports Cere addresses and Proofi deep links
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
    alignItems: 'center',
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  permissionTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxl,
    color: Colors.white,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: Fonts.body,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  overlaySection: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  scanTagline: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.cyan,
    letterSpacing: 3,
    marginBottom: Spacing.md,
  },
  scanTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xl,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  scanSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scanHint: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  scanAreaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.cyan,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  // Result screen
  resultContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl * 2,
    gap: Spacing.xl,
  },
  resultHeader: {
    marginBottom: Spacing.md,
  },
  resultTagline: {
    fontFamily: Fonts.label,
    fontSize: FontSize.xs,
    color: Colors.cyan,
    letterSpacing: 3,
    marginBottom: Spacing.lg,
  },
  resultTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSize.xxxl,
    color: Colors.white,
  },
  scannedDataText: {
    fontFamily: Fonts.mono,
    fontSize: FontSize.xs,
    color: Colors.cyan,
    lineHeight: 18,
  },
  resultActions: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
