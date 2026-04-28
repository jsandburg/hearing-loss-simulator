// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudiogramEditor } from './useAudiogramEditor.js';

beforeEach(() => {
  localStorage.clear();
});

describe('useAudiogramEditor — editor open/close', () => {
  it('starts with editor closed and no editing profile', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.editingProfile).toBeNull();
  });

  it('openNewEditor opens the editor with a fresh empty profile', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    expect(result.current.isEditorOpen).toBe(true);
    expect(result.current.editingProfile).not.toBeNull();
    expect(result.current.editingProfile.left).toEqual(Array(8).fill(0));
    expect(result.current.editingProfile.right).toEqual(Array(8).fill(0));
    expect(result.current.editingProfile.isCustom).toBe(true);
  });

  it('openNewEditor resets syncEars to true', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setSyncEars(false));
    act(() => result.current.openNewEditor());
    expect(result.current.syncEars).toBe(true);
  });

  it('closeEditor clears editingProfile and closes the editor', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.closeEditor());
    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.editingProfile).toBeNull();
  });
});

describe('useAudiogramEditor — editing profile values', () => {
  it('setName updates the profile name (max 60 chars)', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setName('My Profile'));
    expect(result.current.editingProfile.name).toBe('My Profile');
  });

  it('setName truncates at 60 characters', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setName('A'.repeat(80)));
    expect(result.current.editingProfile.name).toHaveLength(60);
  });

  it('setLossValue with syncEars=true updates both ears', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    expect(result.current.syncEars).toBe(true);
    act(() => result.current.setLossValue('right', 3, '40'));
    expect(result.current.editingProfile.right[3]).toBe(40);
    expect(result.current.editingProfile.left[3]).toBe(40);
  });

  it('setLossValue with syncEars=false updates only the specified ear', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setSyncEars(false));
    act(() => result.current.setLossValue('right', 3, '40'));
    expect(result.current.editingProfile.right[3]).toBe(40);
    expect(result.current.editingProfile.left[3]).toBe(0);
  });

  it('setLossValue clamps values to 0–120', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setSyncEars(false));
    act(() => result.current.setLossValue('right', 0, '-10'));
    expect(result.current.editingProfile.right[0]).toBe(0);
    act(() => result.current.setLossValue('right', 0, '999'));
    expect(result.current.editingProfile.right[0]).toBe(120);
  });

  it('setLossValue treats empty string as 0', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setSyncEars(false));
    act(() => result.current.setLossValue('right', 2, ''));
    expect(result.current.editingProfile.right[2]).toBe(0);
  });

  it('setLossValue rounds to nearest integer', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setLossValue('right', 0, '25.7'));
    expect(result.current.editingProfile.right[0]).toBe(26);
  });
});

describe('useAudiogramEditor — save and delete', () => {
  it('saveProfile adds to customProfiles and closes the editor', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setName('Test Profile'));
    act(() => result.current.saveProfile());
    expect(result.current.customProfiles).toHaveLength(1);
    expect(result.current.customProfiles[0].name).toBe('Test Profile');
    expect(result.current.isEditorOpen).toBe(false);
  });

  it('saveProfile returns the saved profile', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setName('Returned Profile'));
    let saved;
    act(() => { saved = result.current.saveProfile(); });
    expect(saved.name).toBe('Returned Profile');
  });

  it('saveProfile returns null when no editingProfile', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    let returned;
    act(() => { returned = result.current.saveProfile(); });
    expect(returned).toBeNull();
  });

  it('deleteProfile removes the profile by id', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setName('To Delete'));
    act(() => result.current.saveProfile());
    const id = result.current.customProfiles[0].id;
    act(() => result.current.deleteProfile(id));
    expect(result.current.customProfiles).toHaveLength(0);
  });

  it('addCustomProfile adds a profile with a new id', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    const incoming = {
      id: 'shared_123',
      name: 'Shared Profile',
      left: Array(8).fill(20),
      right: Array(8).fill(20),
    };
    act(() => result.current.addCustomProfile(incoming));
    expect(result.current.customProfiles).toHaveLength(1);
    expect(result.current.customProfiles[0].id).not.toBe('shared_123');
    expect(result.current.customProfiles[0].isCustom).toBe(true);
    expect(result.current.customProfiles[0].name).toBe('Shared Profile');
  });
});

describe('useAudiogramEditor — localStorage persistence', () => {
  it('persists customProfiles to localStorage on save', () => {
    const { result } = renderHook(() => useAudiogramEditor());
    act(() => result.current.openNewEditor());
    act(() => result.current.setName('Persisted'));
    act(() => result.current.saveProfile());
    const stored = JSON.parse(localStorage.getItem('hearing-sim-custom-audiograms'));
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Persisted');
  });

  it('loads customProfiles from localStorage on mount', () => {
    const profile = {
      id: 'custom_abc',
      name: 'Pre-existing',
      isCustom: true,
      left: Array(8).fill(10),
      right: Array(8).fill(10),
      color: '#36454f',
      colorRight: null,
      bypass: false,
      isConductive: false,
      flatAttenuationL: null,
      flatAttenuationR: null,
      desc: 'Test',
      worklet: { tinnitus: { enabled: false, frequency: 4000, level: 0 } },
    };
    localStorage.setItem('hearing-sim-custom-audiograms', JSON.stringify([profile]));
    const { result } = renderHook(() => useAudiogramEditor());
    expect(result.current.customProfiles).toHaveLength(1);
    expect(result.current.customProfiles[0].name).toBe('Pre-existing');
  });
});
