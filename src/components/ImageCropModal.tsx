import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  PanResponder,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  visible: boolean;
  imageUri: string | null;
  /** Target aspect ratio as width / height (logo = 1, banner = 3). */
  aspect: number;
  label?: string;
  onCancel: () => void;
  onCropped: (uri: string) => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Interactive image cropper for web, where expo-image-picker's `allowsEditing`
 * crop tool doesn't exist. The crop frame is fixed at the target aspect ratio;
 * the user drags the image behind it and zooms with the buttons, then we crop
 * exactly the framed region with expo-image-manipulator before upload. (Native
 * keeps the OS picker's own crop UI, so this is only mounted on web.)
 */
export function ImageCropModal({ visible, imageUri, aspect, label, onCancel, onCropped }: Props) {
  const { colors } = useTheme();
  const { width: winW } = useWindowDimensions();

  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [busy, setBusy] = useState(false);

  // The crop frame on screen. Width caps at 320 (or the viewport), height
  // derives from the aspect ratio.
  const FRAME_W = Math.min(320, winW - 80);
  const FRAME_H = FRAME_W / aspect;

  // Live values the PanResponder reads without re-registering handlers.
  const state = useRef({ scale: 1, tx: 0, ty: 0, imgW: 0, imgH: 0, startTx: 0, startTy: 0 });

  const coverScale = useMemo(() => {
    if (!imgSize) return 1;
    return Math.max(FRAME_W / imgSize.w, FRAME_H / imgSize.h);
  }, [imgSize, FRAME_W, FRAME_H]);

  // Keep the frame fully covered by the image for a given scale.
  const clampOffsets = (s: number, x: number, y: number, w: number, h: number) => ({
    x: clamp(x, FRAME_W - w * s, 0),
    y: clamp(y, FRAME_H - h * s, 0),
  });

  const apply = (s: number, x: number, y: number) => {
    const { imgW, imgH } = state.current;
    const { x: cx, y: cy } = clampOffsets(s, x, y, imgW, imgH);
    state.current.scale = s;
    state.current.tx = cx;
    state.current.ty = cy;
    setScale(s);
    setTx(cx);
    setTy(cy);
  };

  // Load natural size and centre the image at cover scale whenever a new image
  // arrives.
  useEffect(() => {
    if (!visible || !imageUri) return;
    setImgSize(null);
    Image.getSize(
      imageUri,
      (w, h) => {
        const cover = Math.max(FRAME_W / w, FRAME_H / h);
        state.current.imgW = w;
        state.current.imgH = h;
        setImgSize({ w, h });
        // Centre it.
        apply(cover, (FRAME_W - w * cover) / 2, (FRAME_H - h * cover) / 2);
      },
      () => setImgSize(null),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUri, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          state.current.startTx = state.current.tx;
          state.current.startTy = state.current.ty;
        },
        onPanResponderMove: (_e, g) => {
          apply(state.current.scale, state.current.startTx + g.dx, state.current.startTy + g.dy);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [FRAME_W, FRAME_H],
  );

  const zoom = (factor: number) => {
    const next = clamp(state.current.scale * factor, coverScale, coverScale * 5);
    // Zoom around the frame centre so it feels anchored.
    const { tx: ox, ty: oy, scale: os, imgW, imgH } = state.current;
    const cx = FRAME_W / 2;
    const cy = FRAME_H / 2;
    const ratio = next / os;
    const nx = cx - (cx - ox) * ratio;
    const ny = cy - (cy - oy) * ratio;
    void imgW; void imgH;
    apply(next, nx, ny);
  };

  const confirm = async () => {
    if (!imgSize) return;
    const { scale: s, tx: x, ty: y } = state.current;
    const originX = clamp(Math.round(-x / s), 0, imgSize.w - 1);
    const originY = clamp(Math.round(-y / s), 0, imgSize.h - 1);
    const width = clamp(Math.round(FRAME_W / s), 1, imgSize.w - originX);
    const height = clamp(Math.round(FRAME_H / s), 1, imgSize.h - originY);
    setBusy(true);
    try {
      const out = await ImageManipulator.manipulateAsync(
        imageUri!,
        [{ crop: { originX, originY, width, height } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );
      onCropped(out.uri);
    } catch {
      // If the crop fails for any reason, fall back to the uncropped image so
      // the vendor is never blocked from uploading.
      onCropped(imageUri!);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: 20, padding: 20 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 4 }}>
            Crop your {label ?? (aspect === 1 ? 'logo' : 'banner')}
          </Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginBottom: 16 }}>
            Drag to reposition, zoom to fit. This is exactly how it will appear.
          </Text>

          {/* Crop frame */}
          <View style={{ alignItems: 'center' }}>
            <View
              {...panResponder.panHandlers}
              style={{
                width: FRAME_W,
                height: FRAME_H,
                borderRadius: aspect === 1 ? FRAME_W / 2 : 12,
                overflow: 'hidden',
                backgroundColor: colors.surfaceSoft,
                borderWidth: 2,
                borderColor: colors.primary,
              }}
            >
              {imgSize && imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ position: 'absolute', left: tx, top: ty, width: imgSize.w * scale, height: imgSize.h * scale }}
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            </View>
          </View>

          {/* Zoom controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 16 }}>
            <Pressable
              onPress={() => zoom(1 / 1.2)}
              accessibilityLabel="Zoom out"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="remove" size={22} color={colors.ink} />
            </Pressable>
            <Ionicons name="search" size={18} color={colors.inkMuted} />
            <Pressable
              onPress={() => zoom(1.2)}
              accessibilityLabel="Zoom in"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add" size={22} color={colors.ink} />
            </Pressable>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              style={{ flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.ink }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={busy || !imgSize}
              style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: busy || !imgSize ? 0.6 : 1 }}
            >
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.onPrimary }}>Use photo</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
