/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { closeFormOverlay } from 'amo/reducers/formOverlay';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import IconXMark from 'amo/components/IconXMark';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type Props = {|
  children?: React.Node,
  className?: string,
  dispatch: DispatchFunc,
  i18n: I18nType,
  id: string,
  isOpen: boolean,
  isSubmitting: boolean,
  onCancel?: Function,
  onSubmit?: Function,
  submitText?: string,
  submittingText?: string,
  title: string,
|};

export class FormOverlayBase extends React.Component<Props> {
  static defaultProps: {|isOpen: boolean, isSubmitting: boolean|} = {
    isOpen: false,
    isSubmitting: false,
  };

  closeOverlay(event: SyntheticEvent<any>) {
    const { id, dispatch } = this.props;
    event.preventDefault();
    event.stopPropagation();
    dispatch(closeFormOverlay(id));
  }

  onClickBackground: ((event: SyntheticEvent<any>) => void) = (event: SyntheticEvent<any>) => {
    this.closeOverlay(event);
  };

  onClickExIcon: ((event: SyntheticEvent<any>) => void) = (event: SyntheticEvent<any>) => {
    this.closeOverlay(event);
  };

  onClickOverlay: ((event: SyntheticEvent<any>) => void) = (event: SyntheticEvent<any>) => {
    // Prevent the click event from propagating to parent elements.
    // This stops the overlay from closing when clicking inside it.
    event.stopPropagation();
  };

  onCancel: ((event: SyntheticEvent<any>) => void) = (event: SyntheticEvent<any>) => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
    this.closeOverlay(event);
  };

  onSubmit: ((event: SyntheticEvent<any>) => void) = (event: SyntheticEvent<any>) => {
    const { onSubmit } = this.props;
    event.preventDefault();
    event.stopPropagation();
    if (onSubmit) {
      onSubmit();
    }
  };

  render(): null | React.Element<"div"> {
    const {
      children,
      className,
      i18n,
      isOpen,
      isSubmitting,
      submitText,
      submittingText,
      title,
    } = this.props;

    if (!isOpen) {
      return null;
    }

    let formIsDisabled = false;
    let submitPrompt;
    if (isSubmitting) {
      formIsDisabled = true;
      submitPrompt = submittingText || i18n.gettext('Submitting');
    } else {
      submitPrompt = submitText || i18n.gettext('Submit');
    }

    return (
      <div
        onClick={this.onClickBackground}
        className={makeClassName('FormOverlay', className)}
        role="presentation"
      >
        <form
          onClick={this.onClickOverlay}
          className="FormOverlay-overlay"
          role="presentation"
        >
          <header>
            <div className="FormOverlay-close-control">
              <Button
                className="FormOverlay-close-button"
                onClick={this.onClickExIcon}
              >
                <IconXMark alt={i18n.gettext('Click to close')} />
              </Button>
            </div>
            <h3 className="FormOverlay-h3">{title}</h3>
          </header>
          <section className="FormOverlay-content">{children}</section>
          <footer className="FormOverlay-footer">
            {/*
              type=button is necessary to override the default
              of type=submit
            */}
            <Button
              buttonType="neutral"
              disabled={formIsDisabled}
              onClick={this.onCancel}
              className="FormOverlay-cancel"
              puffy
              type="button"
            >
              {i18n.gettext('Cancel')}
            </Button>
            <Button
              buttonType="action"
              disabled={formIsDisabled}
              className="FormOverlay-submit"
              onClick={this.onSubmit}
              type="submit"
              puffy
            >
              {submitPrompt}
            </Button>
          </footer>
        </form>
      </div>
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const overlayState = state.formOverlay[ownProps.id];

  if (!overlayState) {
    return {};
  }

  return {
    isOpen: overlayState.open,
    isSubmitting: overlayState.submitting,
  };
};

const FormOverlay: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(FormOverlayBase);

export default FormOverlay;
