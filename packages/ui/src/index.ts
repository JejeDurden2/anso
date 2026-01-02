// Utils
export { cn } from './lib/utils';

// Components
export { Button, buttonVariants, type ButtonProps } from './components/button';
export { Input, type InputProps } from './components/input';
export { CurrencyInput, type CurrencyInputProps } from './components/currency-input';
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from './components/card';
export { Badge, badgeVariants, type BadgeProps } from './components/badge';
export { Avatar, AvatarRoot, AvatarImage, AvatarFallback, type AvatarProps, type AvatarSize } from './components/avatar';
export { Label } from './components/label';
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/dialog';
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './components/dropdown-menu';
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './components/tooltip';
export { Switch, type SwitchProps } from './components/switch';

// Legacy exports for backwards compatibility
export {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  DropdownButton,
  type DropdownProps,
  type DropdownItemProps,
} from './components/dropdown';
export {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  type ModalProps,
} from './components/modal';
